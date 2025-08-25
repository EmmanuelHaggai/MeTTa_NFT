import { create } from "zustand";
import scaffoldConfig from "~~/services/web3/wagmiConfig";

type GlobalState = {
  nativeCurrencyPrice: number;
  setNativeCurrencyPrice: (newNativeCurrencyPriceState: number) => void;
  targetNetwork: any;
  setTargetNetwork: (newTargetNetwork: any) => void;
};

export const useGlobalState = create<GlobalState>(set => ({
  nativeCurrencyPrice: 0,
  setNativeCurrencyPrice: (newValue: number): void => set(() => ({ nativeCurrencyPrice: newValue })),
  targetNetwork: scaffoldConfig.targetNetwork,
  setTargetNetwork: (newTargetNetwork: any) => set(() => ({ targetNetwork: newTargetNetwork })),
}));