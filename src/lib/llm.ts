import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('Missing OPENAI_API_KEY environment variable');
}

// Ensure the API key is properly formatted by trimming any whitespace
const apiKey = process.env.OPENAI_API_KEY?.trim();

const openai = new OpenAI({
  apiKey: apiKey,
});

export interface LLMResponse {
  content: string;
  error?: string;
}

export async function invokeLLM(prompt: string): Promise<LLMResponse> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });

    return {
      content: completion.choices[0]?.message?.content || '',
    };
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
} 