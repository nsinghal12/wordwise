import { NextResponse } from 'next/server';
import { invokeLLM } from '@/lib/llm';

export async function POST(request: Request) {
  try {
    // Check if request has a body
    if (!request.body) {
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    // Log the raw request body for debugging
    const rawBody = await request.text();
    console.log('Raw request body:', rawBody);

    // Try to parse the JSON body
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Create the blog writing prompt
    const blogPrompt = `Write a blog post on the following topic and return the content in markdown format:\n\n${prompt}`;
    
    // Call the LLM service
    const llmResponse = await invokeLLM(blogPrompt);

    // Check for errors from LLM
    if (llmResponse.error) {
      return NextResponse.json(
        { error: 'Error generating blog content', details: llmResponse.error },
        { status: 500 }
      );
    }

    // Return the generated content
    return NextResponse.json({
      content: llmResponse.content
    });
    
  } catch (error) {
    console.error('Error processing blog creation request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 