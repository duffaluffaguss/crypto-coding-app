import { formatEther, formatGwei, type PublicClient } from 'viem';
import type { NetworkId } from './networks';

// Gas estimation constants
export const GAS_BUFFER_MULTIPLIER = 1.2; // 20% buffer for safety
export const HIGH_GAS_THRESHOLD_GWEI = 50; // Consider gas "high" above 50 gwei

// Hardcoded fallback ETH price (can be updated via API)
export const FALLBACK_ETH_PRICE_USD = 3500;

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  totalCostWei: bigint;
  totalCostEth: string;
  totalCostUsd: string;
  gasPriceGwei: string;
  isHighGas: boolean;
}

export interface GasBreakdown {
  baseFee: string;
  priorityFee: string;
  maxFee: string;
  estimatedGas: string;
  networkName: string;
}

/**
 * Fetch current ETH price in USD
 * Falls back to hardcoded value if API fails
 */
export async function fetchEthPrice(): Promise<number> {
  try {
    // Using CoinGecko free API
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );
    
    if (!response.ok) {
      console.warn('Failed to fetch ETH price, using fallback');
      return FALLBACK_ETH_PRICE_USD;
    }
    
    const data = await response.json();
    return data.ethereum?.usd || FALLBACK_ETH_PRICE_USD;
  } catch (error) {
    console.warn('ETH price fetch error:', error);
    return FALLBACK_ETH_PRICE_USD;
  }
}

/**
 * Estimate gas for contract deployment
 */
export async function estimateDeploymentGas(
  publicClient: PublicClient,
  bytecode: string,
  ethPriceUsd: number = FALLBACK_ETH_PRICE_USD
): Promise<GasEstimate> {
  // Ensure bytecode has 0x prefix
  const formattedBytecode = bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`;
  
  // Estimate gas limit for deployment
  const gasEstimate = await publicClient.estimateGas({
    data: formattedBytecode as `0x${string}`,
  });
  
  // Add buffer for safety
  const gasLimit = BigInt(Math.ceil(Number(gasEstimate) * GAS_BUFFER_MULTIPLIER));
  
  // Get current gas price info
  const feeData = await publicClient.estimateFeesPerGas();
  
  // Calculate total cost
  const gasPrice = feeData.maxFeePerGas || (await publicClient.getGasPrice());
  const totalCostWei = gasLimit * gasPrice;
  const totalCostEth = formatEther(totalCostWei);
  const totalCostUsd = (parseFloat(totalCostEth) * ethPriceUsd).toFixed(2);
  
  // Check if gas is considered high
  const gasPriceGwei = formatGwei(gasPrice);
  const isHighGas = parseFloat(gasPriceGwei) > HIGH_GAS_THRESHOLD_GWEI;
  
  return {
    gasLimit,
    gasPrice,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    totalCostWei,
    totalCostEth,
    totalCostUsd,
    gasPriceGwei,
    isHighGas,
  };
}

/**
 * Get detailed gas breakdown for display
 */
export async function getGasBreakdown(
  publicClient: PublicClient,
  gasEstimate: GasEstimate,
  networkName: string
): Promise<GasBreakdown> {
  const block = await publicClient.getBlock();
  const baseFee = block.baseFeePerGas ? formatGwei(block.baseFeePerGas) : '0';
  
  return {
    baseFee: `${parseFloat(baseFee).toFixed(2)} Gwei`,
    priorityFee: gasEstimate.maxPriorityFeePerGas 
      ? `${parseFloat(formatGwei(gasEstimate.maxPriorityFeePerGas)).toFixed(2)} Gwei`
      : 'N/A',
    maxFee: `${parseFloat(gasEstimate.gasPriceGwei).toFixed(2)} Gwei`,
    estimatedGas: gasEstimate.gasLimit.toString(),
    networkName,
  };
}

/**
 * Format gas estimate for display
 */
export function formatGasDisplay(estimate: GasEstimate): {
  eth: string;
  usd: string;
  gas: string;
  gwei: string;
} {
  return {
    eth: `${parseFloat(estimate.totalCostEth).toFixed(6)} ETH`,
    usd: `$${estimate.totalCostUsd}`,
    gas: estimate.gasLimit.toLocaleString(),
    gwei: `${parseFloat(estimate.gasPriceGwei).toFixed(2)} Gwei`,
  };
}

/**
 * Calculate estimated time based on gas price
 * Higher gas = faster confirmation
 */
export function estimateConfirmationTime(gasPriceGwei: number): string {
  if (gasPriceGwei < 10) return '~5-10 minutes';
  if (gasPriceGwei < 30) return '~1-3 minutes';
  if (gasPriceGwei < 50) return '~30-60 seconds';
  return '~15-30 seconds';
}

/**
 * Get gas warning level
 */
export function getGasWarningLevel(
  estimate: GasEstimate
): 'low' | 'normal' | 'high' | 'very-high' {
  const gwei = parseFloat(estimate.gasPriceGwei);
  const usd = parseFloat(estimate.totalCostUsd);
  
  if (usd > 50 || gwei > 100) return 'very-high';
  if (usd > 20 || gwei > 50) return 'high';
  if (usd < 1 && gwei < 10) return 'low';
  return 'normal';
}
