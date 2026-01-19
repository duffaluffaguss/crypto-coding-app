import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

const CODE_VERIFICATION_PROMPT = `You are a friendly code reviewer helping beginners understand what they've built.

Given this Solidity smart contract code, provide a SHORT, encouraging summary of what the user has created.

RULES:
- Be warm and celebratory ("Great job! You've built...")
- List 2-4 main features/capabilities in bullet points
- Use simple language (no jargon)
- Keep total response under 150 words
- End with a short encouragement to continue

DO NOT:
- Critique the code or suggest improvements
- List things that are missing
- Use technical terminology without explaining it
- Be overly verbose

Example output format:
"🎉 Great job! You've built a Token with these features:

• **Token Basics** - Your token has a name, symbol, and total supply
• **Balance Tracking** - The contract keeps track of who owns how many tokens
• **Transfer Function** - Holders can send tokens to other addresses

You're making awesome progress! Ready for the next lesson?"`;

export async function POST(request: Request) {
  try {
    const { sourceCode, lessonTitle, lessonGoal } = await request.json();

    if (!sourceCode) {
      return NextResponse.json(
        { error: 'Source code is required' },
        { status: 400 }
      );
    }

    // First, compile the code to make sure it's valid
    const solc = await import('solc');

    const input = {
      language: 'Solidity',
      sources: {
        'Contract.sol': {
          content: sourceCode,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*'],
          },
        },
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for compilation errors
    const errors = output.errors?.filter(
      (e: { severity: string }) => e.severity === 'error'
    ) || [];

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        compiled: false,
        errors: errors.map((e: { formattedMessage: string }) => ({
          message: e.formattedMessage,
        })),
      });
    }

    // Code compiled successfully - now get AI summary
    const contextPrompt = lessonTitle && lessonGoal 
      ? `\n\nContext: The user is working on "${lessonTitle}" with the goal: "${lessonGoal}"`
      : '';

    const { text: summary } = await generateText({
      model: google('gemini-2.0-flash'),
      system: CODE_VERIFICATION_PROMPT + contextPrompt,
      prompt: `Here is the Solidity code to summarize:\n\n\`\`\`solidity\n${sourceCode}\n\`\`\``,
    });

    return NextResponse.json({
      success: true,
      compiled: true,
      summary,
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      {
        success: false,
        compiled: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      },
      { status: 500 }
    );
  }
}
