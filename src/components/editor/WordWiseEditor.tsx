import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { marked } from 'marked';
import Alignment from '@tiptap/extension-text-align';
import { Mark } from '@tiptap/core';
import { useGrammarCheck, GrammarError } from '../../lib/useGrammarCheck';
import { useLanguageWorker, SpellingError } from '../../lib/useLanguageWorker';
import { Save, FileDown, Check, X, AlertTriangle, MessageSquare, Wand2, FileText } from 'lucide-react';
import { Filter } from 'bad-words';

// Custom spelling error mark extension
const SpellingErrorMark = Mark.create({
    name: 'spellingError',
    
    addAttributes() {
        return {
            word: {
                default: null,
            },
        };
    },
    
    parseHTML() {
        return [
            {
                tag: 'span[data-spelling-error]',
            },
        ];
    },
    
    renderHTML({ HTMLAttributes }) {
        return ['span', {
            ...HTMLAttributes,
            'data-spelling-error': '',
            class: 'spelling-error bg-red-100 border-b-2 border-red-400 border-dotted cursor-pointer hover:bg-red-200 transition-colors',
            title: 'Click for spelling suggestions'
        }, 0];
    },
});

// Custom grammar error mark extension
const GrammarErrorMark = Mark.create({
    name: 'grammarError',
    
    addAttributes() {
        return {
            errorId: {
                default: null,
            },
            message: {
                default: null,
            },
        };
    },
    
    parseHTML() {
        return [
            {
                tag: 'span[data-grammar-error]',
            },
        ];
    },
    
    renderHTML({ HTMLAttributes }) {
        return ['span', {
            ...HTMLAttributes,
            'data-grammar-error': '',
            class: 'grammar-error bg-orange-100 border-b-2 border-orange-400 border-dotted cursor-pointer hover:bg-orange-200 transition-colors',
            title: `Grammar issue: ${HTMLAttributes.message || 'Click for suggestions'}`
        }, 0];
    },
});

interface WordWiseEditorProps {
    initialContent?: string;
    spellCheck?: boolean;
    grammarCheck?: boolean;
}



const WordWiseEditor: React.FC<WordWiseEditorProps> = ({
    initialContent = '# Start writing here...',
    spellCheck = true,
    grammarCheck = true
}) => {
    const [content, setContent] = useState('');
    const [showGrammarSuggestions, setShowGrammarSuggestions] = useState(false);
    const [selectedError, setSelectedError] = useState<GrammarError | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [hasSpellingErrors, setHasSpellingErrors] = useState(false);
    const [spellingErrors, setSpellingErrors] = useState<SpellingError[]>([]);
    const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [selectedRange, setSelectedRange] = useState<{ from: number; to: number } | null>(null);
    const [hasProfanity, setHasProfanity] = useState(false);
    const [profanityWords, setProfanityWords] = useState<string[]>([]);
    const profanityFilter = new Filter();
    const spellCheckTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    
    // Use the language worker for spell checking and profanity detection
    const { isWorkerReady, checkSpelling, checkProfanity } = useLanguageWorker();



    // Placeholder for spell check functions - will be defined after editor
    let performSpellCheck: (text: string) => void;
    let debouncedSpellCheck: (text: string) => void;

    const editor = useEditor({
        extensions: [
            StarterKit,
            Alignment.configure({
                types: ['heading', 'paragraph'],
            }),
            SpellingErrorMark,
            GrammarErrorMark,
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
                spellcheck: spellCheck ? 'true' : 'false',
                autocorrect: spellCheck ? 'on' : 'off',
            },
            handleClick(view, pos, event) {
                if (event.target instanceof HTMLElement && event.target.hasAttribute('data-spelling-error')) {
                    const word = event.target.textContent || '';
                    
                    // Find the spelling error that matches this word and position
                    const matchingError = spellingErrors.find(error => {
                        return error.word === word && pos >= error.start + 1 && pos <= error.start + 1 + error.length;
                    });
                    
                    if (matchingError) {
                        setSelectedText(word);
                        setSelectedRange({ 
                            from: matchingError.start + 1, 
                            to: matchingError.start + 1 + matchingError.length 
                        });
                        setShowSuggestionPanel(true);
                    }
                } else if (event.target instanceof HTMLElement && event.target.hasAttribute('data-grammar-error')) {
                    const errorId = event.target.getAttribute('data-grammar-error-id');
                    const grammarError = errors.find(error => 
                        pos >= error.offset + 1 && pos <= error.offset + 1 + error.length
                    );
                    
                    if (grammarError) {
                        setSelectedError(grammarError);
                        setSelectedRange({ 
                            from: grammarError.offset + 1, 
                            to: grammarError.offset + 1 + grammarError.length 
                        });
                        setShowSuggestionPanel(true);
                    }
                } else {
                    const { from, to } = view.state.selection;
                    const selectedText = view.state.doc.textBetween(from, to);
                    if (selectedText) {
                        setSelectedText(selectedText);
                        setSelectedRange({ from, to });
                    }
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            const newText = editor.getText();
            // Only update content and run spell check if the text has actually changed
            if (newText !== content) {
                setContent(newText);
            }
        },
    });

    // Spell check function using web worker
    performSpellCheck = useCallback(async (text: string) => {
        if (!isWorkerReady || !editor) return;

        try {
            // First, clear all existing spelling error marks completely
            editor.chain().focus().unsetMark('spellingError').run();
            
            // Small delay to ensure marks are cleared before applying new ones
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Get spelling errors from worker
            const errors = await checkSpelling(text);
            
            // Apply spelling error marks
            errors.forEach(error => {
                const wordStart = error.start;
                const wordEnd = wordStart + error.length;
                
                // Double-check that we're within document bounds
                if (wordStart >= 0 && wordEnd <= editor.state.doc.content.size) {
                    // Apply spelling error mark to this word
                    editor.chain()
                        .setTextSelection({ from: wordStart, to: wordEnd })
                        .setMark('spellingError', { word: error.word })
                        .run();
                }
            });

            setSpellingErrors(errors);
            setHasSpellingErrors(errors.length > 0);

            // Check for profanity using worker
            const wordsFromWorker = await checkProfanity(text);
            const profaneWords = wordsFromWorker.filter((word: string) => profanityFilter.isProfane(word));
            setHasProfanity(profaneWords.length > 0);
            setProfanityWords(profaneWords);

            // Automatically show suggestions panel if there are errors
            if (errors.length > 0) {
                setShowSuggestionPanel(true);
            }
        } catch (error) {
            console.error('Spell check failed:', error);
        }
    }, [isWorkerReady, editor, checkSpelling, checkProfanity, profanityFilter]);

    // Grammar highlight function wrapped in useCallback
    const performGrammarHighlight = useCallback((grammarErrors: GrammarError[]) => {
        if (!editor) return;

        // Run grammar highlighting in a non-blocking way using a Promise
        Promise.resolve().then(async () => {
            // First, clear all existing grammar error marks completely
            editor.chain().focus().unsetMark('grammarError').run();
            
            // Small delay to ensure marks are cleared before applying new ones
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Apply grammar error marks for each error
            grammarErrors.forEach((error, index) => {
                const from = error.offset + 1; // Add 1 to account for document structure
                const to = from + error.length;
                
                // Double-check that we're within document bounds
                if (from >= 0 && to <= editor.state.doc.content.size && from < to) {
                    // Apply grammar error mark to this error
                    editor.chain()
                        .setTextSelection({ from, to })
                        .setMark('grammarError', { 
                            errorId: `grammar-${index}`,
                            message: error.message 
                        })
                        .run();
                }
            });
        });
    }, [editor]);

    // Debounced spell check
    debouncedSpellCheck = useCallback((text: string) => {
        if (spellCheckTimeoutRef.current) {
            clearTimeout(spellCheckTimeoutRef.current);
        }

        spellCheckTimeoutRef.current = setTimeout(async () => {
            await performSpellCheck(text);
        }, 500); // 500ms debounce delay
    }, [performSpellCheck]);

    const { errors, isChecking } = useGrammarCheck({
        text: content,
        language: 'en-US',
        debounceMs: 1000,
    });

    // Show suggestions panel when grammar errors are found
    useEffect(() => {
        if (errors.length > 0) {
            setShowSuggestionPanel(true);
        }
    }, [errors]);

    // Highlight grammar errors when they change
    useEffect(() => {
        if (errors.length > 0) {
            performGrammarHighlight(errors);
        } else if (editor) {
            // Clear grammar error marks when no errors
            editor.chain().unsetMark('grammarError').run();
        }
    }, [errors, performGrammarHighlight, editor]);

    useEffect(() => {
        if (editor && initialContent) {
            // Convert markdown to HTML before setting editor content
            const htmlContent = marked.parse(initialContent);
            editor.commands.setContent(htmlContent);
        }
    }, [editor, initialContent]);

    // Trigger spell check when content changes
    useEffect(() => {
        if (content && isWorkerReady) {
            debouncedSpellCheck(content);
        }
    }, [content, isWorkerReady, debouncedSpellCheck]);

    // Save as PDF function
    const saveAsPDF = useCallback(async () => {
        if (editor && typeof window !== 'undefined' && !hasSpellingErrors && errors.length === 0 && !hasProfanity) {
            try {
                setIsGeneratingPDF(true);
                // Add WordWise footer before generating PDF
                const footerElement = document.createElement('div');
                footerElement.className = 'text-center mt-8 pt-6';
                footerElement.innerHTML = `
                    <div class="inline-flex items-center gap-1.5">
                        <span class="text-[#11A683] font-outfit text-lg font-semibold tracking-wide">
                            Powered by <span class="bg-gradient-to-r from-[#11A683] to-[#15C39A] bg-clip-text text-transparent font-bold">WordWise</span>
                        </span>
                    </div>
                `;
                editor.view.dom.appendChild(footerElement);

                // Dynamically import html2pdf only on the client side
                const html2pdf = (await import('html2pdf.js')).default;
                const element = editor.view.dom;
                const opt = {
                    margin: 1,
                    filename: 'wordwise-document.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                };
                await html2pdf().set(opt).from(element).save();

                // Remove the footer after PDF generation
                // editor.view.dom.removeChild(footerElement);
            } catch (error) {
                console.error('Error generating PDF:', error);
            } finally {
                setIsGeneratingPDF(false);
            }
        }
    }, [editor, hasSpellingErrors, errors, hasProfanity]);

    // Toggle spellcheck
    const toggleSpellCheck = () => {
        if (editor) {
            const editorElement = editor.view.dom as HTMLElement;
            const currentState = editorElement.spellcheck;
            editorElement.spellcheck = !currentState;
            editorElement.setAttribute('autocorrect', !currentState ? 'on' : 'off');
        }
    };

    // Apply grammar suggestion
    const applyGrammarSuggestion = useCallback((replacement: string) => {
        if (editor && selectedError) {
            const { offset, length } = selectedError;
            editor
                .chain()
                .focus()
                .insertContentAt({ from: offset, to: offset + length }, replacement)
                .run();
            setSelectedError(null);
            setShowGrammarSuggestions(false);
        }
    }, [editor, selectedError]);

    // Function to apply a suggestion
    const applySuggestion = useCallback((replacement: string, range: { from: number; to: number }, isGrammar: boolean = false) => {
        if (editor && range) {
            // Clean the replacement text to remove any unwanted characters
            const cleanReplacement = replacement.replace(/[\r\n]/g, '').trim();
            
            if (isGrammar) {
                // For grammar suggestions, we need to adjust the range for Tiptap's document structure
                // LanguageTool gives us plain text offsets, but Tiptap uses document positions
                const adjustedFrom = range.from + 1; // Add 1 to account for document structure
                const adjustedTo = range.to + 1;
                
                // First clear the grammar error mark, then replace the text
                editor
                    .chain()
                    .focus()
                    .setTextSelection({ from: adjustedFrom, to: adjustedTo })
                    .unsetMark('grammarError')
                    .deleteSelection()
                    .insertContent(cleanReplacement)
                    .run();
                
                // Force re-evaluation of grammar errors
                setTimeout(() => {
                    if (editor) {
                        const newText = editor.getText();
                        setContent(newText);
                    }
                }, 50);
            } else {
                // For spelling suggestions, first clear all spelling error marks from the entire document
                // then replace the specific text
                editor
                    .chain()
                    .focus()
                    .setTextSelection({ from: range.from, to: range.to })
                    .unsetMark('spellingError')
                    .deleteSelection()
                    .insertContent(cleanReplacement)
                    .run();
                
                // Clear the spelling error from our local state
                setSpellingErrors(prevErrors => 
                    prevErrors.filter(error => 
                        !(error.start <= range.from && error.start + error.length >= range.to)
                    )
                );
                
                // Force a complete re-check after a short delay to ensure all marks are updated
                setTimeout(async () => {
                    if (editor) {
                        const newText = editor.getText();
                        // Clear all spelling error marks first
                        editor.chain().unsetMark('spellingError').run();
                        // Then re-run spell check
                        await performSpellCheck(newText);
                    }
                }, 100);
            }
            
            // Clear the selection after applying the suggestion
            setSelectedText('');
            setSelectedRange(null);
        }
    }, [editor, performSpellCheck]);

    // Function to get spelling suggestions from worker results
    const getSpellingSuggestions = useCallback((word: string): string[] => {
        const error = spellingErrors.find(err => err.word === word);
        return error ? error.suggestions : [];
    }, [spellingErrors]);

    const MenuButton = ({ onClick, isActive, children }: { onClick: () => void; isActive?: boolean; children: React.ReactNode }) => (
        <button
            onClick={onClick}
            className={`mr-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-gray-100 text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            {children}
        </button>
    );

    const MenuDivider = () => <div className="h-4 w-px bg-gray-200 mx-3" />;

    // Custom Save Button Component
    const SaveButton = () => {
        const isDisabled = isGeneratingPDF || hasProfanity;
        const getButtonText = () => {
            if (isGeneratingPDF) return 'Generating PDF...';
            // if (hasSpellingErrors) return 'Fix Spelling Errors';
            // if (errors.length > 0) return 'Fix Grammar Errors';
            if (hasProfanity) return 'Remove Inappropriate Words';
            return 'Save as PDF';
        };

        const getButtonIcon = () => {
            if (isGeneratingPDF) return <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />;
            if (hasProfanity) {
                return <X className="w-4 h-4" />;
            }
            
            return <FileDown className="w-4 h-4" />;
        };

        return (
            <button
                onClick={saveAsPDF}
                disabled={isDisabled}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${isDisabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-50 text-red-600 hover:bg-red-100 shadow-sm hover:shadow'}
                    ${isGeneratingPDF ? 'animate-pulse' : ''}
                    border border-red-200
                `}
            >
                {getButtonIcon()}
                <span>{getButtonText()}</span>
            </button>
        );
    };

    // Custom Suggestion Panel Component
    const SuggestionPanel = () => {
        // Always show panel if there are errors or spelling suggestions
        const shouldShow = hasSpellingErrors || errors.length > 0;
        if (!shouldShow) return null;

        console.log('Spelling Errors in Panel:', spellingErrors); // Debug log
        console.log('Grammar Errors in Panel:', errors); // Debug log

        // Show all errors if no text is selected, otherwise show only errors in selection
        const relevantGrammarErrors = selectedRange
            ? errors.filter(error =>
                error.offset >= selectedRange.from &&
                error.offset + error.length <= selectedRange.to
            )
            : errors;

        const allSpellingErrors = spellingErrors.map(error => {
            console.log(`Suggestions for "${error.word}":`, error.suggestions); // Debug log
            return {
                word: error.word,
                suggestions: error.suggestions,
                range: { from: error.start, to: error.start + error.length }
            };
        });

        return (
            <div className="w-64 bg-white border-l border-gray-200 h-[calc(100vh-4rem)] overflow-y-auto">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Wand2 className="w-5 h-5 text-[#11A683]" />
                            <h3 className="font-medium text-gray-900">
                                Suggestions ({errors.length + spellingErrors.length})
                            </h3>
                        </div>
                        <button
                            onClick={() => setShowSuggestionPanel(false)}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {allSpellingErrors.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-500">
                                <Check className="w-4 h-4" />
                                <span>Spelling Issues ({allSpellingErrors.length})</span>
                            </div>
                            {allSpellingErrors.map((error, idx) => (
                                <div key={`spell-${idx}-${error.word}`} className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-shadow">
                                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                                        <p className="text-sm text-red-600">Misspelled: <span className="font-medium">{error.word}</span></p>
                                    </div>
                                    <div className="p-2">
                                        {error.suggestions.length > 0 ? (
                                            error.suggestions.slice(0, 3).map((suggestion: string, sIdx: number) => (
                                                <button
                                                    key={`sugg-${sIdx}-${suggestion}`}
                                                    onClick={() => {
                                                        applySuggestion(suggestion, error.range);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer rounded-md transition-colors"
                                                >
                                                    {suggestion}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 px-4 py-2">No suggestions available</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {relevantGrammarErrors.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-500">
                                <MessageSquare className="w-4 h-4" />
                                <span>Grammar Issues ({relevantGrammarErrors.length})</span>
                            </div>
                            {relevantGrammarErrors.map((error, index) => (
                                <div
                                    key={`gram-${index}-${error.offset}`}
                                    className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-shadow"
                                >
                                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                                        <p className="text-sm text-red-600">{error.message}</p>
                                    </div>
                                    <div className="p-2">
                                        {error.replacements.slice(0, 3).map((replacement, idx) => (
                                            <button
                                                key={`rep-${idx}-${replacement}`}
                                                onClick={() => {
                                                    const range = {
                                                        from: error.offset,
                                                        to: error.offset + error.length
                                                    };
                                                    applySuggestion(replacement, range, true);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer rounded-md transition-colors"
                                            >
                                                {replacement}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!hasSpellingErrors && !errors.length && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-2">
                            <Wand2 className="w-8 h-8 text-gray-400" />
                            <p>No suggestions needed!<br />Your writing looks good.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`flex border rounded-xl shadow-sm bg-white transition-all duration-200 hover:shadow-md ${showSuggestionPanel ? 'mr-0' : ''}`}>
            <div className="flex-1 p-4">
                <div className="mb-4 border-b pb-3 flex flex-wrap items-center gap-y-2 sticky top-0 bg-white z-10">
                    {/* Text Style Controls */}
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        isActive={editor?.isActive('bold')}
                    >
                        Bold
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        isActive={editor?.isActive('italic')}
                    >
                        Italic
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                        isActive={editor?.isActive('strike')}
                    >
                        Strike
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleCode().run()}
                        isActive={editor?.isActive('code')}
                    >
                        Code
                    </MenuButton>

                    <MenuDivider />

                    {/* Heading Controls */}
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor?.isActive('heading', { level: 1 })}
                    >
                        H1
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor?.isActive('heading', { level: 2 })}
                    >
                        H2
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                        isActive={editor?.isActive('heading', { level: 3 })}
                    >
                        H3
                    </MenuButton>

                    <MenuDivider />

                    {/* List Controls */}
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        isActive={editor?.isActive('bulletList')}
                    >
                        Bullet List
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        isActive={editor?.isActive('orderedList')}
                    >
                        Numbered List
                    </MenuButton>

                    <MenuDivider />

                    {/* Block Controls */}
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        isActive={editor?.isActive('blockquote')}
                    >
                        Quote
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                        isActive={editor?.isActive('codeBlock')}
                    >
                        Code Block
                    </MenuButton>

                    <MenuDivider />

                    {/* Alignment Controls */}
                    <MenuButton
                        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                        isActive={editor?.isActive({ textAlign: 'left' })}
                    >
                        Left
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                        isActive={editor?.isActive({ textAlign: 'center' })}
                    >
                        Center
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                        isActive={editor?.isActive({ textAlign: 'right' })}
                    >
                        Right
                    </MenuButton>

                    <MenuDivider />

                    {/* Utility Controls */}
                    <MenuButton onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}>
                        Clear Format
                    </MenuButton>

                    <MenuDivider />

                    {/* Spell Check Control */}
                    {/* <MenuButton
                        onClick={toggleSpellCheck}
                        isActive={editor?.view.dom.spellcheck}
                    >
                        Spell Check
                    </MenuButton> */}

                    {/* Grammar Check Control */}
                    {/* <MenuButton
                        onClick={() => setShowGrammarSuggestions(!showGrammarSuggestions)}
                        isActive={showGrammarSuggestions}
                    >
                        Grammar {isChecking ? '(Checking...)' : `(${errors.length})`}
                    </MenuButton> */}

                    {/* <MenuDivider /> */}

                    {/* Suggestions Button */}
                    <button
                        onClick={() => setShowSuggestionPanel(!showSuggestionPanel)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                            ${showSuggestionPanel
                                ? 'bg-[#11A683] text-white'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}
                        `}
                    >
                        <Wand2 className="w-4 h-4" />
                        Suggestions
                        {(hasSpellingErrors || errors.length > 0) && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {(errors.length + spellingErrors.length)}
                            </span>
                        )}
                    </button>

                    <MenuDivider />

                    {/* Save as PDF Control */}
                    {typeof window !== 'undefined' && (
                        <SaveButton />
                    )}
                </div>

                <div className="relative">
                    <EditorContent
                        editor={editor}
                        className="min-h-[200px]"
                    />

                    {/* Profanity Warning */}
                    {hasProfanity && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-700">
                                <AlertTriangle className="w-5 h-5" />
                                <h3 className="font-medium">Inappropriate Content Detected</h3>
                            </div>
                            <p className="mt-1 text-sm text-yellow-600">
                                Please remove the following inappropriate words:
                                <span className="font-medium"> {profanityWords.join(', ')}</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Suggestion Panel */}
            {showSuggestionPanel && <SuggestionPanel />}
        </div>
    );
};

export default WordWiseEditor; 