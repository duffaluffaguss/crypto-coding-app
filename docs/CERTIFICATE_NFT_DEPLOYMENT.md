# CertificateNFT Deployment Guide

This guide explains how to deploy and verify the CertificateNFT smart contract to Base Sepolia (testnet) and Base Mainnet.

## Prerequisites

1. **Node.js** (v18+)
2. **ETH for gas fees**:
   - Base Sepolia: Get testnet ETH from [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
   - Base Mainnet: Bridge ETH from Ethereum mainnet
3. **Deployer wallet** with private key

## Configuration

### 1. Set Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Required for deployment
DEPLOYER_PRIVATE_KEY=your-private-key-here

# RPC URLs (optional, defaults provided)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org

# Contract configuration
CERTIFICATE_METADATA_BASE_URI=https://your-app-domain.com
CERTIFICATE_SOULBOUND=true  # Set to "false" for transferable tokens

# Optional: Set authorized minter after deployment
CERTIFICATE_MINTER_ADDRESS=0x...

# For contract verification
BASESCAN_API_KEY=your-basescan-api-key
```

### 2. Get a Basescan API Key

1. Go to [Basescan](https://basescan.org)
2. Create an account
3. Go to API Keys and create a new key
4. Add it to your `.env.local`

## Compile Contract

```bash
npx hardhat compile
```

## Run Tests

```bash
npx hardhat test test/CertificateNFT.test.ts
```

## Deploy

### Deploy to Base Sepolia (Testnet)

```bash
npx hardhat run scripts/deploy-certificate-nft.ts --network baseSepolia
```

### Deploy to Base Mainnet

```bash
npx hardhat run scripts/deploy-certificate-nft.ts --network base
```

### Expected Output

```
═══════════════════════════════════════════════════════════════
🚀 CertificateNFT Deployment
═══════════════════════════════════════════════════════════════

Network: baseSepolia
Chain ID: 84532
Deployer: 0x...
Balance: 0.1 ETH

Configuration:
  Base URI: https://cryptocode.dev
  Soulbound: true

📦 Deploying CertificateNFT...
✅ CertificateNFT deployed to: 0x...

═══════════════════════════════════════════════════════════════
📋 Add to your .env file:
═══════════════════════════════════════════════════════════════
NEXT_PUBLIC_CERTIFICATE_NFT_BASE_SEPOLIA=0x...

═══════════════════════════════════════════════════════════════
🔍 Verify on block explorer:
═══════════════════════════════════════════════════════════════
npx hardhat verify --network baseSepolia 0x... "https://cryptocode.dev" true

🔗 View on explorer: https://sepolia.basescan.org/address/0x...

═══════════════════════════════════════════════════════════════
🎉 Deployment successful!
═══════════════════════════════════════════════════════════════
```

## Verify Contract

After deployment, verify the contract source code:

```bash
# Base Sepolia
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> "https://your-domain.com" true

# Base Mainnet  
npx hardhat verify --network base <CONTRACT_ADDRESS> "https://your-domain.com" true
```

## Post-Deployment

### 1. Update Environment Variables

Add the deployed contract address to your `.env.local`:

```bash
# For testnet
NEXT_PUBLIC_CERTIFICATE_NFT_BASE_SEPOLIA=0x...

# For mainnet
NEXT_PUBLIC_CERTIFICATE_NFT_BASE=0x...
```

### 2. Set Authorized Minter (Optional)

If you need a separate minter address (e.g., a backend service), call `setMinter`:

```bash
# Using Hardhat console
npx hardhat console --network baseSepolia

> const CertificateNFT = await ethers.getContractFactory("CertificateNFT")
> const cert = CertificateNFT.attach("0x<CONTRACT_ADDRESS>")
> await cert.setMinter("0x<MINTER_ADDRESS>", true)
```

### 3. Test Minting

```javascript
// Test mint via console
> await cert.mintCertificate(
    "0x<USER_ADDRESS>",
    "test-project-001",
    "Test Project",
    "tutorial",
    95
  )
```

## Contract Features

### Soulbound (Non-transferable) Mode

When `soulbound` is `true`:
- Tokens cannot be transferred between addresses
- Only minting to new addresses and burning is allowed
- Perfect for certificates that should stay with the earner

### Score System

Each certificate includes a score (0-100):
- Stored on-chain with the certificate
- Included in the `CertificateMinted` event
- Retrievable via `getCertificate(tokenId)`

### Authorized Minters

- Only authorized minters can mint certificates
- Owner is automatically an authorized minter
- Add/remove minters via `setMinter(address, bool)`

## Contract Addresses

| Network | Chain ID | Address |
|---------|----------|---------|
| Base Sepolia | 84532 | `NEXT_PUBLIC_CERTIFICATE_NFT_BASE_SEPOLIA` |
| Base Mainnet | 8453 | `NEXT_PUBLIC_CERTIFICATE_NFT_BASE` |

## Troubleshooting

### "insufficient funds"
- Ensure deployer wallet has ETH for gas
- Base Sepolia: Use faucet
- Base Mainnet: Bridge from Ethereum

### "nonce too low"
- Wait for pending transactions to complete
- Or reset nonce in wallet

### Verification fails
- Wait a few minutes after deployment
- Ensure `BASESCAN_API_KEY` is set
- Check constructor arguments match exactly

### "replacement transaction underpriced"
- Increase gas price or wait for network congestion to clear

## Gas Costs

Approximate gas costs (varies with network conditions):

| Action | Gas Units | ~Cost (at 1 gwei) |
|--------|-----------|-------------------|
| Deploy | ~1,500,000 | ~0.0015 ETH |
| Mint | ~150,000 | ~0.00015 ETH |
| Set Minter | ~50,000 | ~0.00005 ETH |

## Security Considerations

1. **Protect your private key** - Never commit to git
2. **Use a separate deployer wallet** - Don't use your main wallet
3. **Test on Sepolia first** - Always deploy to testnet before mainnet
4. **Verify contract** - Always verify source code on block explorer
5. **Audit before mainnet** - Consider professional audit for mainnet deployment
