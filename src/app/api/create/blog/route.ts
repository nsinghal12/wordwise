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

    const { prompt, length } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Determine the length instruction based on the selected length
    let lengthInstruction = '';
    switch(length) {
      case '1 page':
        lengthInstruction = 'Keep it concise and focused - aim for about 500-800 words (1 page length).';
        break;
      case '3-5 pages':
        lengthInstruction = 'Write a comprehensive piece - aim for about 1,500-2,500 words (3-5 pages length).';
        break;
      case '8-10 pages':
        lengthInstruction = 'Create an in-depth, detailed article - aim for about 4,000-5,000 words (8-10 pages length).';
        break;
      case '15+ pages':
        lengthInstruction = 'Write an extensive, comprehensive guide - aim for 7,500+ words (15+ pages length).';
        break;
      default:
        lengthInstruction = 'Keep it well-structured and appropriately detailed.';
    }

    // Create the blog writing prompt
    const blogPrompt = `Write a blog post on "${prompt}" using markdown with this framework:

${lengthInstruction}

1. **Title:** Create a 4-8 word viral-style title with power words and 1 emoji (e.g., "The Untold Truth About ${prompt} 🤯")
   
2. **Hook:** Open with 2 punchy sentences max that either:
   - Ask a controversial question 
   - Share a ridiculous personal fail 
   - Drop an absurd statistic 
   *(Include 1 relevant emoji)*

3. **Body:** 
   - Use 3-4 H2 sections with cheeky emoji-enhanced headers
   - Mix self-deprecating humor + pop culture references
   - Add 1 satirical metaphor per section ("Like a toddler with a chainsaw...")
   - Include bullet points with 😂/💡/⚠️ emojis
   - Bold key takeaways for skimmers

4. **Tone:** 
   - 85% witty friend + 15% snarky commentator
   - 1-2 emojis per paragraph max
   - Playful exaggeration ("This changed my life more than discovering avocado toast")

5. **Close:** End with an interactive CTA/question that sparks debate ("Fight me in the comments if you disagree! 👊")

Output ONLY raw markdown without explanations.`;
    
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