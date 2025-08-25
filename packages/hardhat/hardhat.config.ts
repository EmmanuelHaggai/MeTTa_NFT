import * as dotenv from "dotenv";
dotenv.config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!deployerPrivateKey) {
  console.warn("Warning: DEPLOYER_PRIVATE_KEY not set. Using hardhat's default account for local development only.");
}

const defaultPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "localhost",
  namedAccounts: {
    deployer: {
      default: 0,
    },
    artist: {
      default: 1,
    },
    fan1: {
      default: 2,
    },
    fan2: {
      default: 3,
    },
  },
  networks: {
    hardhat: {
      forking: {
        enabled: process.env.MAINNET_FORKING_ENABLED === "true",
        url: process.env.MAINNET_RPC_URL || "https://eth-mainnet.alchemyapi.io/v2/your-api-key",
      },
      chainId: 31337,
      accounts: [
        {
          privateKey: defaultPrivateKey,
          balance: "10000000000000000000000"
        }
      ]
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: [defaultPrivateKey]
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: deployerPrivateKey ? [deployerPrivateKey] : [],
      chainId: 11155111,
    },
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: deployerPrivateKey ? [deployerPrivateKey] : [],
      chainId: 84532,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      "base-sepolia": process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;