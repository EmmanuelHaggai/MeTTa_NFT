import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  rainbowWallet,
  coinbaseWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import scaffoldConfig from "./wagmiConfig";

const { walletConnectProjectId } = scaffoldConfig;

const wallets = [
  metaMaskWallet({ projectId: walletConnectProjectId, chains: [] }),
  walletConnectWallet({ projectId: walletConnectProjectId, chains: [] }),
  rainbowWallet({ projectId: walletConnectProjectId, chains: [] }),
  coinbaseWallet({ appName: "MeTTa Music Drops", chains: [] }),
  injectedWallet({ chains: [] }),
];

export const wagmiConnectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets,
  },
]);