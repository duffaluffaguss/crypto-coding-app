import { NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { buildTutorPrompt } from '@/lib/ai/prompts';

export async function POST(request: Request) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const systemPrompt = buildTutorPrompt({
      projectName: context?.projectName || 'Your Project',
      projectType: context?.projectType || 'nft_marketplace',
      currentLesson: context?.currentLesson || 'Getting Started',
      currentGoal: context?.currentGoal || 'Build your first smart contract',
      currentCode: context?.currentCode || '// No code yet',
    });

    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      prompt: message,
    });

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Error in tutor chat:', error);
    return NextResponse.json(
      { error: 'Failed to get response from tutor' },
      { status: 500 }
    );
  }
}
