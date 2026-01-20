import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying CertificateNFT with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  // Get the base URI from environment or use default
  const baseURI = process.env.CERTIFICATE_METADATA_BASE_URI || "https://cryptocode.dev";
  
  console.log("Using base URI:", baseURI);
  
  // Deploy the contract
  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const certificate = await CertificateNFT.deploy(baseURI);
  
  await certificate.waitForDeployment();
  
  const address = await certificate.getAddress();
  
  console.log("CertificateNFT deployed to:", address);
  console.log("");
  console.log("Add this to your .env file:");
  console.log(`CERTIFICATE_NFT_ADDRESS=${address}`);
  console.log("");
  console.log("To verify on Etherscan:");
  console.log(`npx hardhat verify --network <network> ${address} "${baseURI}"`);
  
  // If there's a minter address in env, set it
  if (process.env.CERTIFICATE_MINTER_ADDRESS) {
    console.log("");
    console.log("Setting authorized minter:", process.env.CERTIFICATE_MINTER_ADDRESS);
    const tx = await certificate.setMinter(process.env.CERTIFICATE_MINTER_ADDRESS, true);
    await tx.wait();
    console.log("Minter authorized!");
  }
  
  return address;
}

main()
  .then((address) => {
    console.log("\n✅ Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
