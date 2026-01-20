import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export const maxDuration = 60;

interface LineExplanation {
  lineNumber: number;
  code: string;
  explanation: string;
  category?: 'pragma' | 'import' | 'contract' | 'variable' | 'function' | 'modifier' | 'event' | 'struct' | 'mapping' | 'comment' | 'other';
}

interface FunctionSection {
  name: string;
  startLine: number;
  endLine: number;
  purpose: string;
  explanations: LineExplanation[];
}

interface ExplainCodeResponse {
  overview: string;
  sections: FunctionSection[];
  allExplanations: LineExplanation[];
}

const EXPLAIN_CODE_PROMPT = `You are a friendly Solidity code explainer for COMPLETE BEGINNERS who may have never coded before.

Analyze the following Solidity code and provide line-by-line explanations.

IMPORTANT:
- Explain like you're talking to a smart friend who knows NOTHING about programming
- Use everyday analogies (bank accounts, vending machines, membership cards, etc.)
- Keep each explanation to 1-2 short sentences
- Be warm and encouraging, not dry and technical
- If a line is simple (like a closing brace), keep the explanation very brief

For each line, categorize it as one of: pragma, import, contract, variable, function, modifier, event, struct, mapping, comment, other

Also identify logical sections/functions in the code with their purpose.

RESPOND WITH VALID JSON ONLY (no markdown, no backticks):
{
  "overview": "A 1-2 sentence summary of what this whole contract does",
  "sections": [
    {
      "name": "Section/function name",
      "startLine": 1,
      "endLine": 10,
      "purpose": "What this section accomplishes",
      "explanations": []
    }
  ],
  "allExplanations": [
    {
      "lineNumber": 1,
      "code": "the actual code on this line",
      "explanation": "beginner-friendly explanation",
      "category": "pragma"
    }
  ]
}

CODE TO EXPLAIN:
`;

export async function POST(request: Request) {
  // Rate limit check
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`explain:${clientId}`, RATE_LIMITS.ai);
  
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
    if (code.length > 15000) {
      return Response.json(
        { error: 'Code is too long. Please explain smaller sections at a time.' },
        { status: 400 }
      );
    }

    const result = await generateText({
      model: google('gemini-2.0-flash'),
      prompt: EXPLAIN_CODE_PROMPT + code,
      maxTokens: 4000,
    });

    // Parse the JSON response
    let parsed: ExplainCodeResponse;
    try {
      // Clean up potential markdown formatting from response
      let cleanText = result.text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }
      parsed = JSON.parse(cleanText.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.text);
      return Response.json(
        { error: 'Failed to parse explanation. Please try again.' },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!parsed.overview || !parsed.allExplanations || !Array.isArray(parsed.allExplanations)) {
      return Response.json(
        { error: 'Invalid response structure. Please try again.' },
        { status: 500 }
      );
    }

    return Response.json(parsed);
  } catch (error) {
    console.error('Explain code error:', error);
    return Response.json(
      { error: 'Failed to explain code. Please try again.' },
      { status: 500 }
    );
  }
}
