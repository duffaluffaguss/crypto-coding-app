'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import type { Project, ProjectFile } from '@/types';

interface ExportButtonProps {
  project: Project;
  files: ProjectFile[];
  currentCode: string;
  activeFileName?: string;
}

export function ExportButton({ project, files, currentCode, activeFileName }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const zip = new JSZip();

      // Create project folder
      const projectName = project.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const folder = zip.folder(projectName);

      if (!folder) {
        throw new Error('Failed to create folder');
      }

      // Add all project files
      for (const file of files) {
        // Use current code for active file
        const content = file.filename === activeFileName ? currentCode : file.content;
        folder.file(`contracts/${file.filename}`, content);
      }

      // Add README
      const readme = generateReadme(project);
      folder.file('README.md', readme);

      // Add package.json for Hardhat
      const packageJson = generatePackageJson(project);
      folder.file('package.json', packageJson);

      // Add Hardhat config
      const hardhatConfig = generateHardhatConfig();
      folder.file('hardhat.config.js', hardhatConfig);

      // Add .gitignore
      const gitignore = `node_modules/
.env
cache/
artifacts/
coverage/
typechain-types/
`;
      folder.file('.gitignore', gitignore);

      // Add .env.example
      const envExample = `# Base Sepolia RPC URL
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Your private key (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Optional: Basescan API key for verification
BASESCAN_API_KEY=your_api_key_here
`;
      folder.file('.env.example', envExample);

      // Add deploy script
      const deployScript = generateDeployScript(files);
      folder.file('scripts/deploy.js', deployScript);

      // Generate and download
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${projectName}.zip`);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export project. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="gap-2"
    >
      {exporting ? (
        <>
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export
        </>
      )}
    </Button>
  );
}

function generateReadme(project: Project): string {
  return `# ${project.name}

Built with [Zero to Crypto Dev](https://crypto-coding-app.vercel.app)

## About

${project.description || 'A Web3 smart contract project.'}

**Project Type:** ${project.project_type}
${project.contract_address ? `**Deployed Contract:** \`${project.contract_address}\`` : ''}
${project.network ? `**Network:** ${project.network}` : ''}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your private key
   \`\`\`

3. Compile contracts:
   \`\`\`bash
   npx hardhat compile
   \`\`\`

4. Deploy to Base Sepolia:
   \`\`\`bash
   npx hardhat run scripts/deploy.js --network base-sepolia
   \`\`\`

## Project Structure

\`\`\`
├── contracts/       # Solidity smart contracts
├── scripts/         # Deployment scripts
├── hardhat.config.js
└── package.json
\`\`\`

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Base Documentation](https://docs.base.org)
- [Solidity Documentation](https://docs.soliditylang.org)
`;
}

function generatePackageJson(project: Project): string {
  const name = project.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return JSON.stringify({
    name,
    version: '1.0.0',
    description: project.description || 'A Web3 smart contract project',
    scripts: {
      compile: 'hardhat compile',
      test: 'hardhat test',
      deploy: 'hardhat run scripts/deploy.js --network base-sepolia',
    },
    devDependencies: {
      '@nomicfoundation/hardhat-toolbox': '^5.0.0',
      hardhat: '^2.22.0',
      dotenv: '^16.4.5',
    },
  }, null, 2);
}

function generateHardhatConfig(): string {
  return `require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },
    "base-mainnet": {
      url: "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
    },
  },
  etherscan: {
    apiKey: {
      "base-sepolia": process.env.BASESCAN_API_KEY || "",
      "base-mainnet": process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
};
`;
}

function generateDeployScript(files: ProjectFile[]): string {
  // Get contract name from first file
  const contractFile = files[0];
  const contractName = contractFile?.filename.replace('.sol', '') || 'Contract';

  return `const hre = require("hardhat");

async function main() {
  console.log("Deploying ${contractName}...");

  const ${contractName} = await hre.ethers.getContractFactory("${contractName}");
  
  // TODO: Add constructor arguments if needed
  const contract = await ${contractName}.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("${contractName} deployed to:", address);

  // Wait for a few blocks before verification
  console.log("Waiting for block confirmations...");
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Verify on Basescan (optional)
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("Contract verified on Basescan!");
  } catch (error) {
    console.log("Verification failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;
}
