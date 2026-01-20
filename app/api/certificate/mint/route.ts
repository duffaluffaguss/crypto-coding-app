import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCertificateNFTAddress, CERTIFICATE_NFT_ABI } from '@/lib/certificate-nft';
import { encodeFunctionData, type Address } from 'viem';

interface MintRequest {
  projectId: string;
  walletAddress: string;
  chainId: number;
}

// POST - Verify project completion and prepare mint parameters
export async function POST(request: NextRequest) {
  try {
    const body: MintRequest = await request.json();
    const { projectId, walletAddress, chainId } = body;

    if (!projectId || !walletAddress || !chainId) {
      return NextResponse.json(
        { error: 'Missing required parameters: projectId, walletAddress, chainId' },
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

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch project with creator info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        profiles!projects_user_id_fkey (
          id,
          display_name
        )
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verify the user owns this project
    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only mint NFTs for your own projects' },
        { status: 403 }
      );
    }

    // Verify project is completed (deployed or published status)
    const isCompleted = project.status === 'deployed' || project.status === 'published';
    if (!isCompleted) {
      return NextResponse.json(
        { 
          error: 'Project must be completed (deployed or published) to mint a certificate NFT',
          status: project.status
        },
        { status: 400 }
      );
    }

    // Get contract address for the chain
    const contractAddress = getCertificateNFTAddress(chainId);
    if (!contractAddress) {
      return NextResponse.json(
        { error: `NFT contract not deployed on chain ${chainId}` },
        { status: 400 }
      );
    }

    // Prepare mint parameters
    const userName = project.profiles?.display_name || 'Web3 Developer';
    
    // Encode the mint function call
    const mintData = encodeFunctionData({
      abi: CERTIFICATE_NFT_ABI,
      functionName: 'mintCertificate',
      args: [
        walletAddress as Address,
        projectId,
        project.name,
        project.project_type,
      ],
    });

    // Return mint parameters for the frontend to execute
    return NextResponse.json({
      success: true,
      mintParams: {
        to: contractAddress,
        data: mintData,
        chainId,
      },
      projectData: {
        projectId,
        projectName: project.name,
        projectType: project.project_type,
        userName,
        contractAddress: project.contract_address,
        network: project.network,
      },
    });
  } catch (error) {
    console.error('Mint preparation error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare mint transaction' },
      { status: 500 }
    );
  }
}

// GET - Check mint status for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const walletAddress = searchParams.get('walletAddress');
    const chainId = searchParams.get('chainId');

    if (!projectId || !walletAddress || !chainId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const contractAddress = getCertificateNFTAddress(parseInt(chainId));
    if (!contractAddress) {
      return NextResponse.json({
        hasMinted: false,
        contractDeployed: false,
        message: 'NFT contract not deployed on this chain',
      });
    }

    // Note: Actual on-chain check should be done client-side using wagmi hooks
    // This endpoint just provides the contract address for the frontend
    return NextResponse.json({
      contractAddress,
      contractDeployed: true,
      chainId: parseInt(chainId),
    });
  } catch (error) {
    console.error('Mint status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check mint status' },
      { status: 500 }
    );
  }
}
