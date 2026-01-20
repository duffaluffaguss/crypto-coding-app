import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("═".repeat(60));
  console.log("🚀 CertificateNFT Deployment");
  console.log("═".repeat(60));
  console.log("");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);
  console.log("Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("");
  
  // Configuration
  const baseURI = process.env.CERTIFICATE_METADATA_BASE_URI || "https://cryptocode.dev";
  const soulbound = process.env.CERTIFICATE_SOULBOUND !== "false"; // Default to true
  
  console.log("Configuration:");
  console.log("  Base URI:", baseURI);
  console.log("  Soulbound:", soulbound);
  console.log("");
  
  // Deploy the contract
  console.log("📦 Deploying CertificateNFT...");
  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const certificate = await CertificateNFT.deploy(baseURI, soulbound);
  
  await certificate.waitForDeployment();
  
  const address = await certificate.getAddress();
  
  console.log("✅ CertificateNFT deployed to:", address);
  console.log("");
  
  // Set authorized minter if provided
  if (process.env.CERTIFICATE_MINTER_ADDRESS) {
    console.log("🔑 Setting authorized minter:", process.env.CERTIFICATE_MINTER_ADDRESS);
    const tx = await certificate.setMinter(process.env.CERTIFICATE_MINTER_ADDRESS, true);
    await tx.wait();
    console.log("✅ Minter authorized!");
    console.log("");
  }
  
  // Output environment variable
  console.log("═".repeat(60));
  console.log("📋 Add to your .env file:");
  console.log("═".repeat(60));
  
  if (network.name === "baseSepolia") {
    console.log(`NEXT_PUBLIC_CERTIFICATE_NFT_BASE_SEPOLIA=${address}`);
  } else if (network.name === "base") {
    console.log(`NEXT_PUBLIC_CERTIFICATE_NFT_BASE=${address}`);
  } else if (network.name === "sepolia") {
    console.log(`NEXT_PUBLIC_CERTIFICATE_NFT_SEPOLIA=${address}`);
  } else if (network.name === "mainnet") {
    console.log(`NEXT_PUBLIC_CERTIFICATE_NFT_MAINNET=${address}`);
  } else {
    console.log(`CERTIFICATE_NFT_ADDRESS=${address}`);
  }
  
  console.log("");
  console.log("═".repeat(60));
  console.log("🔍 Verify on block explorer:");
  console.log("═".repeat(60));
  console.log(`npx hardhat verify --network ${network.name} ${address} "${baseURI}" ${soulbound}`);
  console.log("");
  
  // Explorer links
  const explorerUrls: Record<string, string> = {
    baseSepolia: `https://sepolia.basescan.org/address/${address}`,
    base: `https://basescan.org/address/${address}`,
    sepolia: `https://sepolia.etherscan.io/address/${address}`,
    mainnet: `https://etherscan.io/address/${address}`,
  };
  
  if (explorerUrls[network.name]) {
    console.log("🔗 View on explorer:", explorerUrls[network.name]);
    console.log("");
  }
  
  return address;
}

main()
  .then((address) => {
    console.log("═".repeat(60));
    console.log("🎉 Deployment successful!");
    console.log("═".repeat(60));
    process.exit(0);
  })
  .catch((error) => {
    console.error("");
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
