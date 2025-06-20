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

    const { prompt, length, tone, audience } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Determine the length instruction based on the selected length
    let lengthInstruction = '';
    switch (length) {
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

    // Determine tone instructions
    let toneInstruction = '';
    switch (tone?.toLowerCase()) {
      case 'professional':
        toneInstruction = `
   - Maintain a polished, authoritative voice
   - Use industry-standard terminology
   - Keep the content factual and well-researched
   - Minimal emoji usage (1-2 total)
   - Focus on data-driven insights`;
        break;
      case 'casual':
        toneInstruction = `
   - Write like you're chatting with a friend
   - Use conversational language and relatable examples
   - Include occasional humor and light-hearted remarks
   - Moderate emoji usage (1 per section)
   - Share personal anecdotes when relevant`;
        break;
      case 'humorous':
        toneInstruction = `
   - 85% witty friend + 15% snarky commentator
   - Frequent but tasteful emoji usage
   - Playful exaggeration and pop culture references
   - Include witty metaphors and analogies
   - Keep it entertaining while informative`;
        break;
      default:
        toneInstruction = `
   - Balance professionalism with approachability
   - Use clear, engaging language
   - Include occasional emoji for emphasis
   - Mix insights with relatable examples`;
    }

    // Determine audience-specific instructions
    let audienceInstruction = '';
    switch (audience?.toLowerCase()) {
      case 'professionals':
        audienceInstruction = `
   - Focus on industry trends and advanced concepts
   - Include relevant statistics and case studies
   - Reference industry standards and best practices
   - Address common professional challenges
   - Provide actionable business insights`;
        break;
      case 'students':
        audienceInstruction = `
   - Break down complex concepts into digestible parts
   - Include practical examples and study tips
   - Reference academic contexts and learning scenarios
   - Address common student pain points
   - Provide clear learning takeaways`;
        break;
      case 'general':
        audienceInstruction = `
   - Keep explanations accessible to a broad audience
   - Use universal examples and analogies
   - Avoid technical jargon or explain when necessary
   - Focus on practical, everyday applications
   - Include diverse perspectives`;
        break;
      default:
        audienceInstruction = `
   - Maintain broad appeal while being informative
   - Balance depth with accessibility
   - Include examples for different experience levels
   - Focus on widely applicable insights`;
    }

    // Create the blog writing prompt
    const blogPrompt = `Write a blog post on "${prompt}" using markdown with this framework:

${lengthInstruction}

1. **Title:** Create a 4-8 word compelling title that resonates with ${audience || 'a general'} audience

2. **Hook:** Open with 2 impactful sentences that:
   - Immediately grab the attention of ${audience || 'readers'}
   - Establish relevance to their context
   - Set the appropriate tone for the piece

3. **Body:** 
   - Use 3-4 H2 sections with clear, focused headers
   - Structure content for ${audience || 'general'} comprehension level
   - Include relevant examples and evidence
   - Add bullet points for key takeaways
   - Bold essential points for easy scanning

4. **Tone Instructions:** ${toneInstruction}

5. **Audience Considerations:** ${audienceInstruction}

6. **Close:** End with a relevant call-to-action or discussion prompt that resonates with ${audience || 'readers'}

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