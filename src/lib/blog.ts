import { saveBlogToHistory } from './blogHistory';

// Function to create blog post via API
export async function createBlog(prompt: string, length?: string): Promise<string> {
    try {
        const response = await fetch('/api/create/blog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt, length }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Save to history after successful creation (now async)
        await saveBlogToHistory(prompt, data.content);
        return data.content;
    } catch (error) {
        console.error('Error creating blog:', error);
        throw error;
    }
}
