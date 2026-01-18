import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

interface ABIItem {
  type: string;
  name?: string;
  inputs?: { name: string; type: string }[];
  outputs?: { name: string; type: string }[];
  stateMutability?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { projectName, contractAddress, abi, network } = await request.json();

    if (!abi || !Array.isArray(abi)) {
      return NextResponse.json({ error: 'ABI is required' }, { status: 400 });
    }

    // Filter to get functions only
    const functions = abi.filter((item: ABIItem) => item.type === 'function');
    const readFunctions = functions.filter(
      (f: ABIItem) => f.stateMutability === 'view' || f.stateMutability === 'pure'
    );
    const writeFunctions = functions.filter(
      (f: ABIItem) => f.stateMutability !== 'view' && f.stateMutability !== 'pure'
    );

    const prompt = `Generate a complete, standalone React component for interacting with this smart contract.

CONTRACT DETAILS:
- Name: ${projectName || 'SmartContract'}
- Address: ${contractAddress || '0x...'}
- Network: ${network || 'Base Sepolia'}

ABI FUNCTIONS:
Read Functions (view/pure):
${JSON.stringify(readFunctions, null, 2)}

Write Functions (state-changing):
${JSON.stringify(writeFunctions, null, 2)}

REQUIREMENTS:
1. Create a single React component file that can be dropped into a Next.js project
2. Use wagmi v2 hooks (useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt)
3. Use Tailwind CSS for styling (modern, clean design)
4. Include proper TypeScript types
5. Handle loading states, errors, and success states
6. Format large numbers (BigInt) for display
7. Group read and write functions in separate sections
8. Add a refresh button for read functions
9. Include the contract address with a copy button
10. Make inputs user-friendly with proper labels and placeholders

OUTPUT FORMAT:
Return ONLY the React component code, no explanations. The code should:
- Start with 'use client';
- Import from wagmi, viem, react
- Export the component as default
- Include the ABI as a const at the top
- Be fully functional and ready to use

Generate the complete component now:`;

    const { text: generatedCode } = await generateText({
      model: google('gemini-2.0-flash'),  // Using 2.0 flash for code generation
      prompt,
    });

    // Extract just the code if it's wrapped in markdown code blocks
    let cleanCode = generatedCode;
    const codeBlockMatch = generatedCode.match(/```(?:tsx?|jsx?|javascript|typescript)?\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanCode = codeBlockMatch[1].trim();
    }

    return NextResponse.json({
      success: true,
      code: cleanCode,
      stats: {
        readFunctions: readFunctions.length,
        writeFunctions: writeFunctions.length,
        totalFunctions: functions.length,
      },
    });
  } catch (error) {
    console.error('Frontend generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate frontend' },
      { status: 500 }
    );
  }
}
