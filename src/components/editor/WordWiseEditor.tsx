import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { marked } from 'marked';
import Alignment from '@tiptap/extension-text-align';
import { useGrammarCheck, GrammarError } from '../../lib/useGrammarCheck';
import { Save, FileDown, Check, X, AlertTriangle, MessageSquare, Wand2 } from 'lucide-react';
import { Filter } from 'bad-words';
import Spellchecker from 'hunspell-spellchecker';
import { getWordsForSpellCheck } from '@/lib/utils';

const checker: any = new Spellchecker();

interface WordWiseEditorProps {
    initialContent?: string;
    spellCheck?: boolean;
    grammarCheck?: boolean;
}

interface SpellingError {
    word: string;
    start: number;
    length: number;
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
    const [spellChecker, setSpellChecker] = useState<Spellchecker | null>(null);
    const [hasProfanity, setHasProfanity] = useState(false);
    const [profanityWords, setProfanityWords] = useState<string[]>([]);
    const profanityFilter = new Filter();
    const spellCheckTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Initialize spellchecker
    useEffect(() => {
        const loadDictionary = async () => {
            console.log('Loading dictionary...');
            try {
                const [affData, dicData] = await Promise.all([
                    fetch('/dictionaries/en_US.aff').then(response => response.text()),
                    fetch('/dictionaries/en_US.dic').then(response => response.text())
                ]);

                const dictionaries = checker.parse({
                    aff: affData,
                    dic: dicData
                });

                // load
                checker.use(dictionaries);

                setSpellChecker(checker);
            } catch (error) {
                console.error('Failed to load dictionary:', error);
            }
        };

        loadDictionary();
    }, []);

    // Spell check function wrapped in useCallback
    const performSpellCheck = useCallback((text: string) => {
        if (!spellChecker) return;

        // Run spell check in a non-blocking way using a Promise
        Promise.resolve().then(() => {
            const words = getWordsForSpellCheck(text);
            let position = 0;
            const errors: SpellingError[] = [];

            words.forEach(word => {
                if(!word || word.length === 0) {
                    return;
                }

                // clean up the word
                word = word.replace(/[.,!?:;]+$/, '');

                // Skip empty words, numbers, and URLs
                if (!word.match(/^\d+$/) && !word.match(/^https?:\/\//)) {
                    if (!spellChecker.check(word)) {
                        errors.push({
                            word,
                            start: position,
                            length: word.length
                        });
                    }
                }
                position += word.length + 1; // +1 for the space
            });

            setSpellingErrors(errors);
            setHasSpellingErrors(errors.length > 0);

            const profaneWords = words.filter(word => profanityFilter.isProfane(word));
            setHasProfanity(profaneWords.length > 0);
            setProfanityWords(profaneWords);


            // Automatically show suggestions panel if there are errors
            if (errors.length > 0) {
                setShowSuggestionPanel(true);
            }
        });
    }, [spellChecker, setSpellingErrors, setHasSpellingErrors, setShowSuggestionPanel]);

    // Debounced spell check
    const debouncedSpellCheck = useCallback((text: string) => {
        if (spellCheckTimeoutRef.current) {
            clearTimeout(spellCheckTimeoutRef.current);
        }

        spellCheckTimeoutRef.current = setTimeout(() => {
            performSpellCheck(text);
        }, 500); // 500ms debounce delay
    }, [performSpellCheck, spellCheckTimeoutRef]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Alignment.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
                spellcheck: spellCheck ? 'true' : 'false',
                autocorrect: spellCheck ? 'on' : 'off',
            },
            handleClick(view, pos, event) {
                const { from, to } = view.state.selection;
                const selectedText = view.state.doc.textBetween(from, to);
                setSelectedText(selectedText);
                setSelectedRange({ from, to });

                // Check if clicked on a misspelled word
                if (!selectedText && event.target instanceof HTMLElement) {
                    const element = event.target;
                    if (element.classList.contains('spelling-error')) {
                        const word = element.textContent || '';
                        setSelectedText(word);
                        // Find the position of this word in the document
                        const parent = element.parentElement;
                        if (parent) {
                            const offset = Array.from(parent.childNodes).indexOf(element);
                            setSelectedRange({ from: pos - word.length, to: pos });
                        }
                    }
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            const text = editor.getText();
            setContent(text);

            // Use debounced spell check instead of immediate check
            if (spellChecker) {
                debouncedSpellCheck(text);
            }
        },
    });

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

    useEffect(() => {
        if (editor && initialContent) {
            // Convert markdown to HTML before setting editor content
            const htmlContent = marked.parse(initialContent);
            editor.commands.setContent(htmlContent);
        }
    }, [editor, initialContent]);

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
    const applySuggestion = useCallback((replacement: string, range: { from: number; to: number }) => {
        if (editor) {
            editor
                .chain()
                .focus()
                .insertContentAt(range, replacement)
                .run();
        }
    }, [editor]);

    // Function to get spelling suggestions
    const getSpellingSuggestions = useCallback((word: string): string[] => {
        if (!word || !spellChecker) return [];
        return spellChecker.suggest(word);
    }, [spellChecker]);

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
        const isDisabled = hasSpellingErrors || errors.length > 0 || isGeneratingPDF || hasProfanity;
        const getButtonText = () => {
            if (isGeneratingPDF) return 'Generating PDF...';
            if (hasSpellingErrors) return 'Fix Spelling Errors';
            if (errors.length > 0) return 'Fix Grammar Errors';
            if (hasProfanity) return 'Remove Inappropriate Words';
            return 'Save as PDF';
        };

        const getButtonIcon = () => {
            if (isGeneratingPDF) return <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />;
            if (hasSpellingErrors || errors.length > 0 || hasProfanity) return <X className="w-4 h-4" />;
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
                {!isDisabled && !isGeneratingPDF && (
                    <div className="flex items-center gap-1 ml-2 text-xs bg-red-100 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" />
                        Ready
                    </div>
                )}
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
            const suggestions = spellChecker ? spellChecker.suggest(error.word) : [];
            console.log(`Suggestions for "${error.word}":`, suggestions); // Debug log
            return {
                word: error.word,
                suggestions,
                range: { from: error.start, to: error.start + error.length }
            };
        });

        return (
            <div className="w-64 bg-white border-l border-gray-200 h-screen fixed right-0 top-0 flex flex-col transition-transform duration-200 ease-in-out">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
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
                                            error.suggestions.slice(0, 3).map((suggestion, sIdx) => (
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
                                                    applySuggestion(replacement, range);
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
        <div className={`border rounded-xl p-4 shadow-sm bg-white transition-all duration-200 hover:shadow-md ${showSuggestionPanel ? 'mr-64' : ''}`}>
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
                <MenuButton
                    onClick={toggleSpellCheck}
                    isActive={editor?.view.dom.spellcheck}
                >
                    Spell Check
                </MenuButton>

                {/* Grammar Check Control */}
                <MenuButton
                    onClick={() => setShowGrammarSuggestions(!showGrammarSuggestions)}
                    isActive={showGrammarSuggestions}
                >
                    Grammar {isChecking ? '(Checking...)' : `(${errors.length})`}
                </MenuButton>

                <MenuDivider />

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
                            {errors.length}
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
                    className="min-h-[200px] [&_*]:spelling-error:underline [&_*]:spelling-error:decoration-red-500 [&_*]:spelling-error:decoration-wavy"
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

                {/* Suggestion Panel */}
                <SuggestionPanel />
            </div>
        </div>
    );
};

export default WordWiseEditor; 