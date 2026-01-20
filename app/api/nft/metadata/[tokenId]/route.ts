import { NextRequest, NextResponse } from 'next/server';
import { getCertificate, getCertificateNFTAddress, formatCompletionDate } from '@/lib/certificate-nft';
import { baseSepolia, base } from 'viem/chains';

// Cache metadata for 1 hour
export const revalidate = 3600;

// ERC-721 Metadata JSON Schema
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: {
    trait_type: string;
    value: string | number;
    display_type?: string;
  }[];
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  nft_marketplace: 'NFT Marketplace',
  token: 'Token',
  dao: 'DAO',
  game: 'On-Chain Game',
  social: 'Social Platform',
  creator: 'Creator Economy',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const tokenId = BigInt(params.tokenId);
    
    // Get chain ID from query params, default to Base Sepolia
    const { searchParams } = new URL(request.url);
    const chainIdParam = searchParams.get('chainId');
    const chainId = chainIdParam ? parseInt(chainIdParam) : baseSepolia.id;

    // Verify contract is deployed on this chain
    const contractAddress = getCertificateNFTAddress(chainId);
    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract not deployed on this network' },
        { status: 404 }
      );
    }

    // Fetch certificate data from the blockchain
    let certificate;
    try {
      certificate = await getCertificate(chainId, tokenId);
    } catch (error) {
      console.error('Error fetching certificate:', error);
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Validate certificate exists
    if (!certificate || !certificate.projectId) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Format completion date
    const completionDate = formatCompletionDate(certificate.completionDate);
    const completionTimestamp = Number(certificate.completionDate);
    
    // Get network name
    const networkName = chainId === base.id ? 'Base Mainnet' : 'Base Sepolia';
    
    // Get project type label
    const projectTypeLabel = PROJECT_TYPE_LABELS[certificate.projectType] || certificate.projectType;

    // Get base URL for images
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zerotocryptodev.com';

    // Build the metadata
    const metadata: NFTMetadata = {
      name: `Zero to Crypto Dev Certificate #${tokenId}`,
      description: `${certificate.recipient} completed ${certificate.projectName} on ${completionDate}. This NFT certifies completion of a Web3 development project on the Zero to Crypto Dev platform.`,
      image: `${baseUrl}/api/nft/image/${tokenId}?chainId=${chainId}`,
      external_url: `${baseUrl}/certificate/${certificate.projectId}`,
      attributes: [
        {
          trait_type: 'Project Type',
          value: projectTypeLabel,
        },
        {
          trait_type: 'Project Name',
          value: certificate.projectName,
        },
        {
          trait_type: 'Completion Date',
          value: completionTimestamp,
          display_type: 'date',
        },
        {
          trait_type: 'Network Deployed',
          value: networkName,
        },
        {
          trait_type: 'User Address',
          value: certificate.recipient,
        },
        {
          trait_type: 'Token ID',
          value: Number(tokenId),
          display_type: 'number',
        },
        {
          trait_type: 'Contract Version',
          value: '1.0',
        },
      ],
    };

    // Return with proper headers for ERC-721 metadata
    return NextResponse.json(metadata, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('NFT metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFT metadata' },
      { status: 500 }
    );
  }
}

// Support CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
