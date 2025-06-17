import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { marked } from 'marked';

interface WordWiseEditorProps {
    initialContent?: string;
}

const WordWiseEditor: React.FC<WordWiseEditorProps> = ({ initialContent = '# Start writing here...' }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: '', // Initialize empty, we'll set content after converting markdown
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
            },
        },
    });

    useEffect(() => {
        if (editor && initialContent) {
            // Convert markdown to HTML before setting editor content
            const htmlContent = marked.parse(initialContent);
            editor.commands.setContent(htmlContent);
        }
    }, [editor, initialContent]);

    return (
        <div className="border rounded-lg p-4 shadow-sm">
            <div className="mb-4 border-b pb-2">
                <button
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`mr-2 px-3 py-1 rounded ${editor?.isActive('bold') ? 'bg-gray-200' : ''}`}
                >
                    Bold
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`mr-2 px-3 py-1 rounded ${editor?.isActive('italic') ? 'bg-gray-200' : ''}`}
                >
                    Italic
                </button>
                <button
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`mr-2 px-3 py-1 rounded ${editor?.isActive('heading') ? 'bg-gray-200' : ''}`}
                >
                    Heading
                </button>
            </div>
            <EditorContent editor={editor} className="min-h-[200px]" />
        </div>
    );
};

export default WordWiseEditor; 