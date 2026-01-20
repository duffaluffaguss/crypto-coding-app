import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { CODE_REVIEW_PROMPT, parseReviewResponse, type CodeReviewResult } from '@/lib/review';

export const maxDuration = 60;

export async function POST(request: Request) {
  // Rate limit check
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`review:${clientId}`, RATE_LIMITS.ai);
  
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return Response.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Limit code length to prevent abuse
    if (code.length > 20000) {
      return Response.json(
        { error: 'Code is too long. Please review smaller sections at a time (max 20,000 characters).' },
        { status: 400 }
      );
    }

    // Minimum code length check
    if (code.trim().length < 50) {
      return Response.json(
        { error: 'Code is too short for a meaningful review. Please provide more code.' },
        { status: 400 }
      );
    }

    const result = await generateText({
      model: google('gemini-2.0-flash'),
      prompt: CODE_REVIEW_PROMPT + code,
      maxTokens: 4000,
    });

    // Parse the JSON response
    let parsed: CodeReviewResult;
    try {
      parsed = parseReviewResponse(result.text);
    } catch (parseError) {
      console.error('Failed to parse AI review response:', result.text);
      return Response.json(
        { error: 'Failed to parse review. Please try again.' },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!parsed.summary || typeof parsed.overallScore !== 'number') {
      return Response.json(
        { error: 'Invalid review response structure. Please try again.' },
        { status: 500 }
      );
    }

    return Response.json(parsed);
  } catch (error) {
    console.error('Code review error:', error);
    return Response.json(
      { error: 'Failed to review code. Please try again.' },
      { status: 500 }
    );
  }
}
