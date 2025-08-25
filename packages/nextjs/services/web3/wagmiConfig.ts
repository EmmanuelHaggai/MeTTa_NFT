import { Chain } from "wagmi";
import * as chains from "wagmi/chains";

export type ScaffoldConfig = {
  targetNetwork: Chain;
  pollingInterval: number;
  alchemyApiKey: string;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
  walletAutoConnect: boolean;
};

const scaffoldConfig = {
  targetNetwork: chains.hardhat,
  pollingInterval: 30000,
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "",
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "",
  onlyLocalBurnerWallet: true,
  walletAutoConnect: true,
} satisfies ScaffoldConfig;

export const hardhat: Chain = {
  id: 31_337,
  name: "Hardhat",
  network: "hardhat",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    public: { http: ["http://127.0.0.1:8545"] },
    default: { http: ["http://127.0.0.1:8545"] },
  },
};

export const appChains = [
  chains.mainnet,
  chains.sepolia,
  chains.baseSepolia,
  hardhat,
];

export default scaffoldConfig;