import { useState } from "react";
import { useNetwork, usePublicClient } from "wagmi";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { useAccountBalance } from "~~/hooks/scaffold-eth";

export const FaucetButton = () => {
  const { chain: ConnectedChain } = useNetwork();
  const [loading, setLoading] = useState(false);
  
  const { balance } = useAccountBalance();
  const publicClient = usePublicClient();

  const isLocalNetwork = ConnectedChain?.id === 31337;

  if (!isLocalNetwork) {
    return null;
  }

  const sendETH = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call a faucet endpoint
      console.log("Faucet not implemented in demo");
    } catch (error) {
      console.error("Faucet error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        className="btn btn-primary btn-sm font-normal gap-1"
        onClick={sendETH}
        disabled={loading}
      >
        {!loading ? (
          <>
            <BanknotesIcon className="h-4 w-4" />
            <span>Faucet</span>
          </>
        ) : (
          <span className="loading loading-spinner loading-xs"></span>
        )}
      </button>
    </div>
  );
};