import { NextResponse } from 'next/server';
import { createPublicClient, http, formatGwei } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { fetchEthPrice, HIGH_GAS_THRESHOLD_GWEI, estimateConfirmationTime } from '@/lib/gas';
import type { NetworkId } from '@/lib/networks';

const chains = {
  'base-sepolia': baseSepolia,
  'base-mainnet': base,
} as const;

const rpcUrls = {
  'base-sepolia': process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
  'base-mainnet': 'https://mainnet.base.org',
} as const;

/**
 * GET /api/gas?network=base-sepolia
 * Fetch current gas prices for a network
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const network = (searchParams.get('network') || 'base-sepolia') as NetworkId;

    // Validate network
    if (!chains[network]) {
      return NextResponse.json(
        { error: 'Invalid network. Use base-sepolia or base-mainnet' },
        { status: 400 }
      );
    }

    // Create public client
    const publicClient = createPublicClient({
      chain: chains[network],
      transport: http(rpcUrls[network]),
    });

    // Fetch gas data and ETH price in parallel
    const [feeData, gasPrice, block, ethPriceUsd] = await Promise.all([
      publicClient.estimateFeesPerGas().catch(() => null),
      publicClient.getGasPrice(),
      publicClient.getBlock(),
      fetchEthPrice(),
    ]);

    const baseFeePerGas = block.baseFeePerGas || BigInt(0);
    const maxFeePerGas = feeData?.maxFeePerGas || gasPrice;
    const maxPriorityFeePerGas = feeData?.maxPriorityFeePerGas || BigInt(0);

    // Format values
    const gasPriceGwei = formatGwei(gasPrice);
    const baseFeeGwei = formatGwei(baseFeePerGas);
    const maxFeeGwei = formatGwei(maxFeePerGas);
    const priorityFeeGwei = formatGwei(maxPriorityFeePerGas);

    // Determine gas level
    const gasPriceNum = parseFloat(gasPriceGwei);
    const isHighGas = gasPriceNum > HIGH_GAS_THRESHOLD_GWEI;
    const estimatedTime = estimateConfirmationTime(gasPriceNum);

    let gasLevel: 'low' | 'normal' | 'high' | 'very-high' = 'normal';
    if (gasPriceNum > 100) gasLevel = 'very-high';
    else if (gasPriceNum > HIGH_GAS_THRESHOLD_GWEI) gasLevel = 'high';
    else if (gasPriceNum < 10) gasLevel = 'low';

    return NextResponse.json({
      success: true,
      network,
      timestamp: new Date().toISOString(),
      gasPrice: {
        wei: gasPrice.toString(),
        gwei: parseFloat(gasPriceGwei).toFixed(4),
      },
      eip1559: {
        baseFeePerGas: {
          wei: baseFeePerGas.toString(),
          gwei: parseFloat(baseFeeGwei).toFixed(4),
        },
        maxFeePerGas: {
          wei: maxFeePerGas.toString(),
          gwei: parseFloat(maxFeeGwei).toFixed(4),
        },
        maxPriorityFeePerGas: {
          wei: maxPriorityFeePerGas.toString(),
          gwei: parseFloat(priorityFeeGwei).toFixed(4),
        },
      },
      ethPriceUsd,
      gasLevel,
      isHighGas,
      estimatedConfirmationTime: estimatedTime,
      blockNumber: Number(block.number),
    });
  } catch (error) {
    console.error('Gas price fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch gas prices',
      },
      { status: 500 }
    );
  }
}
