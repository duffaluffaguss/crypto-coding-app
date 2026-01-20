import { createPublicClient, http, Address, isAddress } from 'viem';
import { mainnet } from 'viem/chains';

// Create a public client for ENS operations
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

/**
 * Get ENS name for an Ethereum address
 */
export async function getEnsName(address: string): Promise<string | null> {
  try {
    if (!isAddress(address)) {
      throw new Error('Invalid Ethereum address');
    }

    const ensName = await publicClient.getEnsName({
      address: address as Address,
    });

    return ensName;
  } catch (error) {
    console.error('Error fetching ENS name:', error);
    return null;
  }
}

/**
 * Get Ethereum address for an ENS name
 */
export async function getEnsAddress(name: string): Promise<string | null> {
  try {
    const address = await publicClient.getEnsAddress({
      name,
    });

    return address;
  } catch (error) {
    console.error('Error fetching ENS address:', error);
    return null;
  }
}

/**
 * Get ENS avatar for an ENS name
 */
export async function getEnsAvatar(name: string): Promise<string | null> {
  try {
    const avatar = await publicClient.getEnsAvatar({
      name,
    });

    return avatar;
  } catch (error) {
    console.error('Error fetching ENS avatar:', error);
    return null;
  }
}

/**
 * Get ENS text records for an ENS name
 */
export async function getEnsText(name: string, key: string): Promise<string | null> {
  try {
    const text = await publicClient.getEnsText({
      name,
      key,
    });

    return text;
  } catch (error) {
    console.error('Error fetching ENS text record:', error);
    return null;
  }
}

/**
 * Validate ENS name format
 */
export function isValidEnsName(name: string): boolean {
  const ensRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.eth$/i;
  return ensRegex.test(name);
}

/**
 * Get ENS metadata including avatar and description
 */
export async function getEnsMetadata(name: string) {
  try {
    const [address, avatar, description, url] = await Promise.all([
      getEnsAddress(name),
      getEnsAvatar(name),
      getEnsText(name, 'description'),
      getEnsText(name, 'url'),
    ]);

    return {
      name,
      address,
      avatar,
      description,
      url,
    };
  } catch (error) {
    console.error('Error fetching ENS metadata:', error);
    return null;
  }
}

/**
 * Check if an address owns a specific ENS name
 */
export async function verifyEnsOwnership(address: string, ensName: string): Promise<boolean> {
  try {
    if (!isAddress(address) || !isValidEnsName(ensName)) {
      return false;
    }

    const resolvedAddress = await getEnsAddress(ensName);
    return resolvedAddress?.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying ENS ownership:', error);
    return false;
  }
}