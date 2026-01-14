import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { buildTutorPrompt } from '@/lib/ai/prompts';

export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages, context } = await request.json();

  const systemPrompt = buildTutorPrompt({
    projectName: context?.projectName || 'Your Project',
    projectType: context?.projectType || 'nft_marketplace',
    currentLesson: context?.currentLesson || 'Getting Started',
    currentGoal: context?.currentGoal || 'Build your first smart contract',
    currentCode: context?.currentCode || '// No code yet',
  });

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
