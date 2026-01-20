/**
 * Basescan API helpers for contract verification
 */

interface VerifyContractRequest {
  address: string;
  sourceCode: string;
  compilerVersion: string;
  contractName: string;
  constructorArgs?: string;
  optimizationUsed?: boolean;
  runs?: number;
}

interface VerificationStatusResponse {
  status: string;
  message: string;
  result: string;
}

interface VerifyContractResponse {
  status: string;
  message: string;
  result: string; // GUID for status checking
}

const BASESCAN_API_URL = 'https://api.basescan.org/api';

/**
 * Submit contract source code for verification on Basescan
 */
export async function verifyContract(params: VerifyContractRequest): Promise<VerifyContractResponse> {
  const apiKey = process.env.BASESCAN_API_KEY;
  
  if (!apiKey) {
    throw new Error('BASESCAN_API_KEY is required');
  }

  const formData = new FormData();
  formData.append('module', 'contract');
  formData.append('action', 'verifysourcecode');
  formData.append('apikey', apiKey);
  formData.append('contractaddress', params.address);
  formData.append('sourceCode', params.sourceCode);
  formData.append('codeformat', 'solidity-single-file');
  formData.append('contractname', params.contractName);
  formData.append('compilerversion', params.compilerVersion);
  formData.append('optimizationUsed', params.optimizationUsed ? '1' : '0');
  formData.append('runs', (params.runs || 200).toString());
  
  if (params.constructorArgs) {
    formData.append('constructorArguements', params.constructorArgs);
  }

  try {
    const response = await fetch(BASESCAN_API_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Basescan API error: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('Error verifying contract:', error);
    throw error;
  }
}

/**
 * Check the verification status using GUID
 */
export async function checkVerificationStatus(guid: string): Promise<VerificationStatusResponse> {
  const apiKey = process.env.BASESCAN_API_KEY;
  
  if (!apiKey) {
    throw new Error('BASESCAN_API_KEY is required');
  }

  try {
    const response = await fetch(
      `${BASESCAN_API_URL}?module=contract&action=checkverifystatus&guid=${guid}&apikey=${apiKey}`
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Basescan API error: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('Error checking verification status:', error);
    throw error;
  }
}

/**
 * Get the Basescan URL for a verified contract
 */
export function getContractUrl(address: string): string {
  return `https://basescan.org/address/${address}#code`;
}

/**
 * Poll verification status until completion or timeout
 */
export async function pollVerificationStatus(
  guid: string, 
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<VerificationStatusResponse> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const status = await checkVerificationStatus(guid);
    
    // Status values: "0" = Pending, "1" = Success, "2" = Failure
    if (status.status === '1' || status.status === '2') {
      return status;
    }
    
    attempts++;
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  throw new Error('Verification timeout - please check status manually');
}

/**
 * Format constructor arguments for verification
 */
export function formatConstructorArgs(args: any[]): string {
  if (!args || args.length === 0) {
    return '';
  }
  
  // Simple ABI encoding - for more complex types, consider using ethers.js
  return args.map(arg => {
    if (typeof arg === 'string') {
      return arg.replace('0x', '');
    }
    return arg.toString();
  }).join('');
}