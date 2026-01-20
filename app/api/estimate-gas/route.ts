import { NextResponse } from 'next/server';
import { createPublicClient, http, formatEther, formatGwei } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';
import { 
  GAS_BUFFER_MULTIPLIER, 
  FALLBACK_ETH_PRICE_USD,
  HIGH_GAS_THRESHOLD_GWEI,
  fetchEthPrice 
} from '@/lib/gas';
import type { NetworkId } from '@/lib/networks';

const chains = {
  'base-sepolia': baseSepolia,
  'base-mainnet': base,
} as const;

const rpcUrls = {
  'base-sepolia': process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
  'base-mainnet': 'https://mainnet.base.org',
} as const;

export async function POST(request: Request) {
  // Rate limit check
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(`estimate-gas:${clientId}`, RATE_LIMITS.compile);
  
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult);
  }

  try {
    const { bytecode, network = 'base-sepolia' } = await request.json() as {
      bytecode: string;
      network?: NetworkId;
    };

    if (!bytecode) {
      return NextResponse.json(
        { error: 'Bytecode is required' },
        { status: 400 }
      );
    }

    // Validate network
    if (!chains[network]) {
      return NextResponse.json(
        { error: 'Invalid network' },
        { status: 400 }
      );
    }

    // Create public client for the selected network
    const publicClient = createPublicClient({
      chain: chains[network],
      transport: http(rpcUrls[network]),
    });

    // Ensure bytecode has 0x prefix
    const formattedBytecode = bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`;

    // Estimate gas for deployment
    let gasEstimate: bigint;
    try {
      gasEstimate = await publicClient.estimateGas({
        data: formattedBytecode as `0x${string}`,
      });
    } catch (err: any) {
      // If estimation fails, provide a rough estimate based on bytecode size
      // ~200 gas per byte + 21000 base + 32000 contract creation
      const bytecodeBytes = (formattedBytecode.length - 2) / 2;
      gasEstimate = BigInt(53000 + bytecodeBytes * 200);
    }

    // Add buffer for safety
    const gasLimit = BigInt(Math.ceil(Number(gasEstimate) * GAS_BUFFER_MULTIPLIER));

    // Get current gas price
    const [feeData, ethPrice] = await Promise.all([
      publicClient.estimateFeesPerGas().catch(() => null),
      fetchEthPrice(),
    ]);

    const gasPrice = feeData?.maxFeePerGas || await publicClient.getGasPrice();
    const totalCostWei = gasLimit * gasPrice;
    const totalCostEth = formatEther(totalCostWei);
    const totalCostUsd = (parseFloat(totalCostEth) * ethPrice).toFixed(2);
    const gasPriceGwei = formatGwei(gasPrice);
    const isHighGas = parseFloat(gasPriceGwei) > HIGH_GAS_THRESHOLD_GWEI;

    // Get block for base fee
    const block = await publicClient.getBlock();
    const baseFeeGwei = block.baseFeePerGas ? formatGwei(block.baseFeePerGas) : '0';

    return NextResponse.json({
      success: true,
      estimate: {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        maxFeePerGas: feeData?.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData?.maxPriorityFeePerGas?.toString(),
        totalCostWei: totalCostWei.toString(),
        totalCostEth,
        totalCostUsd,
        gasPriceGwei,
        isHighGas,
      },
      breakdown: {
        baseFee: `${parseFloat(baseFeeGwei).toFixed(2)} Gwei`,
        priorityFee: feeData?.maxPriorityFeePerGas 
          ? `${parseFloat(formatGwei(feeData.maxPriorityFeePerGas)).toFixed(2)} Gwei`
          : 'N/A',
        maxFee: `${parseFloat(gasPriceGwei).toFixed(2)} Gwei`,
        estimatedGas: gasLimit.toString(),
      },
      ethPrice,
      network,
    });
  } catch (error) {
    console.error('Gas estimation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gas estimation failed',
      },
      { status: 500 }
    );
  }
}
