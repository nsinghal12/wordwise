import { NextResponse } from 'next/server';

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

    // For now, just return "hello world" in markdown format
    return NextResponse.json({
      content: '# hello world'
    });
    
  } catch (error) {
    console.error('Error processing blog creation request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 