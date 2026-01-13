import { http, createConfig } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    coinbaseWallet({
      appName: 'Zero to Crypto Dev',
      preference: 'smartWalletOnly',
    }),
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
    [base.id]: http('https://mainnet.base.org'),
  },
});

export const SUPPORTED_CHAINS = {
  testnet: baseSepolia,
  mainnet: base,
} as const;

export const DEFAULT_CHAIN = baseSepolia;
