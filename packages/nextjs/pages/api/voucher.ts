import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";

interface VoucherRequest {
  wallet: string;
  tokenId: number;
  collection: string;
  tier?: string;
  discountBps?: number;
  maxQuantity?: number;
}

interface MintVoucher {
  collection: string;
  tokenId: number;
  wallet: string;
  price: string;
  discountBps: number;
  maxQuantity: number;
  startTime: number;
  endTime: number;
  nonce: number;
  signature: string;
}

// Mock price data - in real implementation, fetch from contracts
const TOKEN_PRICES: Record<number, string> = {
  1: ethers.utils.parseEther("0.01").toString(), // Music NFT
  2: ethers.utils.parseEther("0.05").toString(), // VIP Pass
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { wallet, tokenId, collection, tier, discountBps, maxQuantity }: VoucherRequest = req.body;

    // Validation
    if (!wallet || !tokenId || !collection) {
      return res.status(400).json({ error: "Missing required fields: wallet, tokenId, collection" });
    }

    if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: "Invalid wallet address format" });
    }

    // Get signer from environment variable (in production, use secure key management)
    const signerPrivateKey = process.env.VOUCHER_SIGNER_PRIVATE_KEY || 
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Default hardhat key for demo
    
    const signer = new ethers.Wallet(signerPrivateKey);

    // Get base price for token
    const basePrice = TOKEN_PRICES[tokenId];
    if (!basePrice) {
      return res.status(400).json({ error: `Unknown token ID: ${tokenId}` });
    }

    // Set defaults based on tier or request
    let finalDiscountBps = discountBps || 0;
    let finalMaxQuantity = maxQuantity || 1;

    // Apply tier-based defaults if no specific values provided
    if (tier && !discountBps) {
      switch (tier) {
        case "vip":
          finalDiscountBps = 2500; // 25%
          finalMaxQuantity = 5;
          break;
        case "premium":
          finalDiscountBps = 2000; // 20%
          finalMaxQuantity = 3;
          break;
        case "standard":
          finalDiscountBps = 500; // 5%
          finalMaxQuantity = 1;
          break;
      }
    }

    // Create voucher
    const now = Math.floor(Date.now() / 1000);
    const oneWeek = 7 * 24 * 60 * 60;
    const nonce = Math.floor(Math.random() * 1000000); // In production, use proper nonce management

    const voucher = {
      collection,
      tokenId,
      wallet,
      price: basePrice,
      discountBps: finalDiscountBps,
      maxQuantity: finalMaxQuantity,
      startTime: now,
      endTime: now + oneWeek,
      nonce,
    };

    // Create EIP-712 domain and types
    const domain = {
      name: "MeTTaPersonalizedMinter",
      version: "1",
      chainId: 31337, // Default to hardhat for demo
      verifyingContract: process.env.PERSONALIZED_MINTER_ADDRESS || ethers.constants.AddressZero,
    };

    const types = {
      MintVoucher: [
        { name: "collection", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "wallet", type: "address" },
        { name: "price", type: "uint256" },
        { name: "discountBps", type: "uint256" },
        { name: "maxQuantity", type: "uint256" },
        { name: "startTime", type: "uint256" },
        { name: "endTime", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    };

    // Sign the voucher
    const signature = await signer._signTypedData(domain, types, voucher);

    const signedVoucher: MintVoucher = {
      ...voucher,
      signature,
    };

    // Calculate final price for display
    const discountAmount = ethers.BigNumber.from(basePrice).mul(finalDiscountBps).div(10000);
    const finalPrice = ethers.BigNumber.from(basePrice).sub(discountAmount);

    // Log voucher creation (in production, store in database)
    console.log(`Voucher created for ${wallet}:`, {
      tokenId,
      tier,
      discount: `${finalDiscountBps / 100}%`,
      finalPrice: ethers.utils.formatEther(finalPrice),
      maxQuantity: finalMaxQuantity,
      nonce,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      data: {
        voucher: signedVoucher,
        metadata: {
          basePrice: ethers.utils.formatEther(basePrice),
          finalPrice: ethers.utils.formatEther(finalPrice),
          discountAmount: ethers.utils.formatEther(discountAmount),
          discountPercentage: `${finalDiscountBps / 100}%`,
          validUntil: new Date((now + oneWeek) * 1000).toISOString(),
          tier: tier || "custom",
        },
      },
    });
  } catch (error) {
    console.error("Voucher API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create voucher",
    });
  }
}