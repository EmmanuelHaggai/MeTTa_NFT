import { useBalance, useAccount } from "wagmi";

export function useAccountBalance() {
  const { address } = useAccount();
  const { data: balance, isError, isLoading } = useBalance({
    address,
  });

  return { balance, isError, isLoading };
}