import { NextRequest, NextResponse } from 'next/server';
import { verifyContract, checkVerificationStatus, pollVerificationStatus } from '@/lib/basescan';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      address, 
      sourceCode, 
      compilerVersion, 
      contractName,
      constructorArgs,
      optimizationUsed = false,
      runs = 200 
    } = body;

    // Validate required fields
    if (!address || !sourceCode || !compilerVersion || !contractName) {
      return NextResponse.json(
        { error: 'Missing required fields: address, sourceCode, compilerVersion, contractName' },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid contract address format' },
        { status: 400 }
      );
    }

    // Submit contract for verification
    const verificationResult = await verifyContract({
      address,
      sourceCode,
      compilerVersion,
      contractName,
      constructorArgs,
      optimizationUsed,
      runs
    });

    // Check if submission was successful
    if (verificationResult.status !== '1') {
      return NextResponse.json(
        { 
          error: 'Verification submission failed', 
          message: verificationResult.message 
        },
        { status: 400 }
      );
    }

    const guid = verificationResult.result;

    // Poll for verification completion (with timeout)
    try {
      const finalStatus = await pollVerificationStatus(guid, 15, 3000); // 15 attempts, 3s apart = 45s max
      
      return NextResponse.json({
        success: true,
        status: finalStatus.status,
        message: finalStatus.message,
        guid,
        contractUrl: `https://basescan.org/address/${address}#code`
      });
    } catch (pollError) {
      // If polling times out, return the GUID so client can check manually
      return NextResponse.json({
        success: true,
        status: 'pending',
        message: 'Verification submitted successfully, but still pending. Please check manually.',
        guid,
        contractUrl: `https://basescan.org/address/${address}#code`
      });
    }

  } catch (error) {
    console.error('Contract verification error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guid = searchParams.get('guid');

    if (!guid) {
      return NextResponse.json(
        { error: 'GUID parameter is required' },
        { status: 400 }
      );
    }

    const status = await checkVerificationStatus(guid);

    return NextResponse.json({
      status: status.status,
      message: status.message,
      result: status.result
    });

  } catch (error) {
    console.error('Status check error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}