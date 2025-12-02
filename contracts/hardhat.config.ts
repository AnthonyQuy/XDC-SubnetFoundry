import dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-viem";
import hardhatIgnitionViemPlugin from "@nomicfoundation/hardhat-ignition-viem"; 

import { readFileSync } from "fs";
import { join } from "path";
import { HardhatUserConfig } from "hardhat/config";
import { defineConfig } from "hardhat/config";


// Load .env
dotenv.config();

// Load chainId from subnet genesis.json (single source of truth)
let CHAIN_ID = 57539; // Default fallback
try {
  const genesisPath = join(process.cwd(),"..", "subnet", "genesis.json");
  const genesis = JSON.parse(readFileSync(genesisPath, "utf-8"));
  CHAIN_ID = genesis.config.chainId;
  console.log(`✓ Loaded chainId ${CHAIN_ID} from subnet/genesis.json`);
} catch (error) {
  console.warn(`⚠ Could not read genesis.json, using default chainId: ${CHAIN_ID}`);
}

// Load other values from .env
const SUBNET_URL = process.env.SUBNET_URL || "http://192.168.25.11:8545";
const PARENTNET_URL = process.env.PARENTNET_URL || "https://erpc.apothem.network/";
const SUBNET_PK = process.env.SUBNET_PK || "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

const config: HardhatUserConfig = defineConfig({
  plugins: [hardhatIgnitionViemPlugin],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    subnet: {
      type: "http",
      url: SUBNET_URL,
      accounts: [SUBNET_PK],
      chainId: CHAIN_ID,
      gasPrice: "auto",
      gas: "auto",
    }
  },
  paths: {
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./compiled",
  }
});

export default config;
