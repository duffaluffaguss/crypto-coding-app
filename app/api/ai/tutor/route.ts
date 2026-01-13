import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildTutorPrompt } from '@/lib/ai/prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    return NextResponse.json({ response: textContent.text });
  } catch (error) {
    console.error('Error in tutor chat:', error);
    return NextResponse.json(
      { error: 'Failed to get response from tutor' },
      { status: 500 }
    );
  }
}
