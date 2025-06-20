import { saveBlogToHistory } from './blogHistory';

// Function to create blog post via API
export async function createBlog(prompt: string, tone?: string, audience?: string, length?: string): Promise<string> {
    try {
        const response = await fetch('/api/create/blog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, tone, audience, length }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { title, content } = await response.json();
        // Save to history after successful creation (now async)
        await saveBlogToHistory(title, prompt, content);
        return content;
    } catch (error) {
        console.error('Error creating blog:', error);
        throw error;
    }
}
