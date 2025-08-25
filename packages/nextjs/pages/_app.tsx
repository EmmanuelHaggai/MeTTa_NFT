import { useEffect, useState } from "react";
import type { AppProps } from "next/app";
import { RainbowKitProvider, getDefaultWallets, connectorsForWallets } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base, sepolia, baseSepolia } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { Toaster } from "react-hot-toast";
import NextNProgress from "nextjs-toploader";

import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { wagmiConnectors } from "~~/services/web3/wagmiConnectors";
import { appChains } from "~~/services/web3/wagmiConfig";
import "~~/styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";

const ScaffoldEthApp = ({ Component, pageProps }: AppProps) => {
  const price = useNativeCurrencyPrice();
  const setNativeCurrencyPrice = useGlobalState(state => state.setNativeCurrencyPrice);

  useEffect(() => {
    if (price > 0) {
      setNativeCurrencyPrice(price);
    }
  }, [setNativeCurrencyPrice, price]);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="relative flex flex-col flex-1">
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

const ScaffoldEthAppWithProviders = ({ Component, pageProps }: AppProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { chains, publicClient, webSocketPublicClient } = configureChains(
    [
      mainnet,
      polygon,
      optimism,
      arbitrum,
      base,
      sepolia,
      baseSepolia,
      {
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
      },
    ],
    [
      alchemyProvider({
        apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF",
        priority: 1,
      }),
      publicProvider({ priority: 2 }),
      jsonRpcProvider({
        rpc: chain => {
          if (chain.id === 31337) {
            return { http: "http://127.0.0.1:8545" };
          }
          return null;
        },
        priority: 3,
      }),
    ],
  );

  const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: wagmiConnectors,
    publicClient,
    webSocketPublicClient,
  });

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        chains={chains}
        avatar={BlockieAvatar}
        theme="auto"
        appInfo={{
          appName: "MeTTa Music Drops",
          learnMoreUrl: "https://github.com/scaffold-eth/scaffold-eth-2",
        }}
      >
        <NextNProgress />
        <ScaffoldEthApp Component={Component} pageProps={pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default ScaffoldEthAppWithProviders;