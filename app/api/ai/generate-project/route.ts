import { NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { PROJECT_GENERATOR_PROMPT } from '@/lib/ai/prompts';

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

    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      system: PROJECT_GENERATOR_PROMPT,
      prompt: userMessage,
    });

    // Parse the JSON response
    let projects;
    try {
      projects = JSON.parse(text);
    } catch {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
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
