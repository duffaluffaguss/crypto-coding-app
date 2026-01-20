import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCertificateNFTAddress } from '@/lib/certificate-nft';

interface RecordMintRequest {
  tokenId: string;
  projectId: string;
  walletAddress: string;
  txHash: string;
  chainId: number;
  projectName: string;
  projectType: string;
}

// POST - Record a successful certificate mint
export async function POST(request: NextRequest) {
  try {
    const body: RecordMintRequest = await request.json();
    const { tokenId, projectId, walletAddress, txHash, chainId, projectName, projectType } = body;

    // Validate required fields
    if (!tokenId || !projectId || !walletAddress || !txHash || !chainId || !projectName || !projectType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate tx hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }

    // Get contract address
    const contractAddress = getCertificateNFTAddress(chainId);
    if (!contractAddress) {
      return NextResponse.json(
        { error: `NFT contract not deployed on chain ${chainId}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the user owns this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only record mints for your own projects' },
        { status: 403 }
      );
    }

    // Record the mint
    const { data: mintRecord, error: insertError } = await supabase
      .from('minted_certificates')
      .insert({
        token_id: parseInt(tokenId),
        project_id: projectId,
        user_id: user.id,
        wallet_address: walletAddress.toLowerCase(),
        tx_hash: txHash.toLowerCase(),
        chain_id: chainId,
        contract_address: contractAddress.toLowerCase(),
        project_name: projectName,
        project_type: projectType,
      })
      .select()
      .single();

    if (insertError) {
      // Handle duplicate mint
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Certificate already recorded' },
          { status: 409 }
        );
      }
      console.error('Error recording mint:', insertError);
      return NextResponse.json(
        { error: 'Failed to record mint' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mintRecord,
    });
  } catch (error) {
    console.error('Record mint error:', error);
    return NextResponse.json(
      { error: 'Failed to record mint' },
      { status: 500 }
    );
  }
}

// GET - Check if a project has been minted
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const walletAddress = searchParams.get('walletAddress');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let query = supabase
      .from('minted_certificates')
      .select('*')
      .eq('project_id', projectId);

    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress.toLowerCase());
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking mint status:', error);
      return NextResponse.json(
        { error: 'Failed to check mint status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasMinted: !!data,
      mintRecord: data || null,
    });
  } catch (error) {
    console.error('Check mint status error:', error);
    return NextResponse.json(
      { error: 'Failed to check mint status' },
      { status: 500 }
    );
  }
}
