import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Rate limit check
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`compile:${clientId}`, RATE_LIMITS.compile);
  
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const { sourceCode, contractName } = await request.json();

    if (!sourceCode) {
      return NextResponse.json(
        { error: 'Source code is required' },
        { status: 400 }
      );
    }

    // Dynamically import solc to avoid issues with server-side compilation
    const solc = await import('solc');

    const input = {
      language: 'Solidity',
      sources: {
        [`${contractName || 'Contract'}.sol`]: {
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

    // Check for errors
    const errors = output.errors?.filter(
      (e: { severity: string }) => e.severity === 'error'
    ) || [];
    const warnings = output.errors?.filter(
      (e: { severity: string }) => e.severity === 'warning'
    ) || [];

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors: errors.map((e: { formattedMessage: string; sourceLocation?: { start: number; end: number } }) => ({
          message: e.formattedMessage,
          severity: 'error' as const,
          line: e.sourceLocation?.start,
        })),
        warnings: warnings.map((w: { formattedMessage: string }) => ({
          message: w.formattedMessage,
          severity: 'warning' as const,
        })),
      });
    }

    // Get compiled contract
    const contracts = output.contracts?.[`${contractName || 'Contract'}.sol`];
    const contract = contracts ? Object.values(contracts)[0] as {
      evm?: { bytecode?: { object?: string } };
      abi?: unknown[];
    } : null;

    if (!contract) {
      return NextResponse.json({
        success: false,
        errors: [{ message: 'No contract found in source', severity: 'error' as const }],
      });
    }

    return NextResponse.json({
      success: true,
      bytecode: contract.evm?.bytecode?.object,
      abi: contract.abi,
      warnings: warnings.map((w: { formattedMessage: string }) => ({
        message: w.formattedMessage,
        severity: 'warning' as const,
      })),
    });
  } catch (error) {
    console.error('Compilation error:', error);
    return NextResponse.json(
      {
        success: false,
        errors: [{
          message: error instanceof Error ? error.message : 'Compilation failed',
          severity: 'error' as const,
        }]
      },
      { status: 500 }
    );
  }
}
