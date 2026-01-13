import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { PROJECT_GENERATOR_PROMPT } from '@/lib/ai/prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { interests } = await request.json();

    if (!interests || interests.length === 0) {
      return NextResponse.json(
        { error: 'Interests are required' },
        { status: 400 }
      );
    }

    const userMessage = `The user's interests are: ${interests.join(', ')}.
Generate 3 unique Web3 project ideas that combine these passions with blockchain technology.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: PROJECT_GENERATOR_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract the text content from the response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    // Parse the JSON response
    let projects;
    try {
      projects = JSON.parse(textContent.text);
    } catch {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        projects = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse project ideas');
      }
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error generating projects:', error);
    return NextResponse.json(
      { error: 'Failed to generate project ideas' },
      { status: 500 }
    );
  }
}
