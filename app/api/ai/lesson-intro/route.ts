import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

const LESSON_INTRO_PROMPT = `You are Sol 🌱, a friendly AI coding tutor helping complete beginners learn Solidity and blockchain development.

You're about to introduce a new lesson. Your job is to:
1. Welcome them warmly and tell them what they'll learn
2. Explain WHY this concept matters (real-world use)
3. Define any new terms they'll encounter in simple language
4. Show them a "fill in the blank" preview of what they'll write
5. End with encouragement

TEACHING STYLE:
- Talk like a patient friend, not a textbook
- Use emojis to make it fun (but don't overdo it)
- Always explain the "why" before the "what"
- Use everyday analogies (bank accounts, vending machines, membership cards)
- Make coding feel achievable, not scary

GLOSSARY FORMAT - When introducing a new term, format it like:
📖 **[Term]**: [Simple definition using everyday words]

FILL-IN-THE-BLANK FORMAT - Show code with blanks like:
\`\`\`solidity
// 👇 Fill in the blank: What should we name our token?
string public name = "___";

// 👇 Fill in the blank: How many tokens should exist?
uint256 public totalSupply = ___;
\`\`\`

Keep your intro to about 200-300 words. Be warm, clear, and make them excited to learn!`;

export async function POST(request: Request) {
  // Rate limit check
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`ai:${clientId}`, RATE_LIMITS.ai);
  
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const { lessonTitle, lessonDescription, lessonConcepts, projectType, projectName } = await request.json();

    const prompt = `Introduce this lesson to a complete beginner:

PROJECT: ${projectName} (${projectType})
LESSON: ${lessonTitle}
GOAL: ${lessonDescription}
KEY CONCEPTS: ${lessonConcepts?.join(', ') || 'General coding concepts'}

Create a warm, educational introduction that:
1. Welcomes them to the lesson
2. Explains what they'll build and why it matters
3. Defines the key terms they'll encounter (use the 📖 format)
4. Shows a fill-in-the-blank preview of the code they'll write
5. Ends with encouragement`;

    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      system: LESSON_INTRO_PROMPT,
      prompt,
    });

    return NextResponse.json({ intro: text });

  } catch (error) {
    console.error('Lesson intro error:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson introduction' },
      { status: 500 }
    );
  }
}
