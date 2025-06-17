import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { marked } from 'marked';
import Alignment from '@tiptap/extension-text-align';
import { useGrammarCheck, GrammarError } from '../../lib/useGrammarCheck';

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

    const editor = useEditor({
        extensions: [
            StarterKit,
            Alignment.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: '', // Initialize empty, we'll set content after converting markdown
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
                spellcheck: spellCheck ? 'true' : 'false',
                autocorrect: spellCheck ? 'on' : 'off',
            },
        },
        onUpdate: ({ editor }) => {
            setContent(editor.getText());
        },
    });

    const { errors, isChecking } = useGrammarCheck({
        text: content,
        language: 'en-US',
        debounceMs: 1000,
    });

    useEffect(() => {
        if (editor && initialContent) {
            // Convert markdown to HTML before setting editor content
            const htmlContent = marked.parse(initialContent);
            editor.commands.setContent(htmlContent);
        }
    }, [editor, initialContent]);

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

    const MenuButton = ({ onClick, isActive, children }: { onClick: () => void; isActive?: boolean; children: React.ReactNode }) => (
        <button
            onClick={onClick}
            className={`mr-2 px-3 py-1 rounded hover:bg-gray-100 transition-colors ${
                isActive ? 'bg-gray-200' : ''
            }`}
        >
            {children}
        </button>
    );

    const MenuDivider = () => <div className="h-4 w-px bg-gray-200 mx-2" />;

    return (
        <div className="border rounded-lg p-4 shadow-sm">
            <div className="mb-4 border-b pb-2 flex flex-wrap items-center gap-y-2">
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
            </div>
            
            <div className="relative">
                <EditorContent 
                    editor={editor} 
                    className="min-h-[200px] [&_*]:spelling-error:underline [&_*]:spelling-error:decoration-red-500 [&_*]:spelling-error:decoration-wavy" 
                />
                
                {/* Grammar Suggestions Panel */}
                {showGrammarSuggestions && errors.length > 0 && (
                    <div className="absolute right-0 top-0 w-64 bg-white border rounded-lg shadow-lg p-4 space-y-4">
                        <h3 className="font-semibold text-sm">Grammar Suggestions</h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {errors.map((error, index) => (
                                <div 
                                    key={`${error.offset}-${index}`} 
                                    className="text-sm p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    onClick={() => setSelectedError(error)}
                                >
                                    <p className="text-red-600">{error.message}</p>
                                    {selectedError === error && error.replacements.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {error.replacements.slice(0, 3).map((replacement, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => applyGrammarSuggestion(replacement)}
                                                    className="block w-full text-left px-2 py-1 text-sm hover:bg-blue-50 rounded"
                                                >
                                                    {replacement}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WordWiseEditor; 