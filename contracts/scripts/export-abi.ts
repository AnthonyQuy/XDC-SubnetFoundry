/**
 * Export the deployed contract ABI to a location accessible by the frontend
 * This ensures the frontend always uses the correct, deployed contract ABI
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Deployment {
  name: string;
  time: number;
}

interface ContractArtifact {
  abi: any[];
  contractName: string;
  sourceName: string;
}

async function exportABI() {
  // Find the latest deployment
  const deploymentsDir = path.join(__dirname, '../ignition/deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    console.error('Deployments directory not found!');
    process.exit(1);
  }

  const chainDirs = fs.readdirSync(deploymentsDir)
    .filter(f => fs.statSync(path.join(deploymentsDir, f)).isDirectory())
    .filter(f => f.startsWith('chain-'));

  if (chainDirs.length === 0) {
    console.error('No deployments found!');
    process.exit(1);
  }

  // Get the most recent deployment
  const sortedChainDirs: Deployment[] = chainDirs
    .map(dir => ({
      name: dir,
      time: fs.statSync(path.join(deploymentsDir, dir)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  const latestDeployment = path.join(deploymentsDir, sortedChainDirs[0].name);
  console.log(`Using deployment from: ${sortedChainDirs[0].name}`);

  // Read the contract artifact
  const artifactPath = path.join(latestDeployment, 'artifacts/NetworkManagerModule#NetworkManager.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('Contract artifact not found!');
    process.exit(1);
  }

  const artifact: ContractArtifact = fs.readJsonSync(artifactPath);

  // Create output directory
  const outputDir = path.join(__dirname, '../../frontend/src/contracts');
  await fs.ensureDir(outputDir);

  // Export ABI as JSON
  const abiPath = path.join(outputDir, 'NetworkManager.abi.json');
  await fs.writeJson(abiPath, artifact.abi, { spaces: 2 });
  console.log(`✓ ABI exported to: frontend/src/contracts/NetworkManager.abi.json`);

  // Export as TypeScript module
  const tsContent = `/**
 * NetworkManager Contract ABI
 * Auto-generated from deployed contract
 * DO NOT EDIT MANUALLY - Run 'npm run export-abi' in contracts directory to update
 */

export const NetworkManagerABI = ${JSON.stringify(artifact.abi, null, 2)} as const;

export type NetworkManagerABI = typeof NetworkManagerABI;
`;

  const tsPath = path.join(outputDir, 'NetworkManager.abi.ts');
  await fs.writeFile(tsPath, tsContent);
  console.log(`✓ TypeScript ABI exported to: frontend/src/contracts/NetworkManager.abi.ts`);

  console.log('\nSuccessfully exported contract ABI!');
}

// Execute
exportABI()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error exporting ABI:', error);
    process.exit(1);
  });
