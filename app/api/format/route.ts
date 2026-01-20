import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'No code provided' },
        { status: 400 }
      );
    }

    // Dynamic import to prevent bundling issues with worker threads
    const prettier = await import('prettier');
    const solidityPlugin = await import('prettier-plugin-solidity');

    const formatted = await prettier.format(code, {
      parser: 'solidity-parse',
      plugins: [solidityPlugin.default || solidityPlugin],
      printWidth: 100,
      tabWidth: 4,
      useTabs: false,
      singleQuote: false,
      bracketSpacing: true,
    });

    return NextResponse.json({ formatted });
  } catch (error: any) {
    console.error('Format error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to format code' },
      { status: 500 }
    );
  }
}
