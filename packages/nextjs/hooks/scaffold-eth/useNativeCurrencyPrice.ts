import { useEffect, useState } from "react";

export const useNativeCurrencyPrice = () => {
  const [nativeCurrencyPrice, setNativeCurrencyPrice] = useState(0);

  useEffect(() => {
    // Mock price for demo - in real implementation, fetch from API
    setNativeCurrencyPrice(2000);
  }, []);

  return nativeCurrencyPrice;
};