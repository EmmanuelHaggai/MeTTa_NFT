import { NextApiRequest, NextApiResponse } from "next";

interface MeTTaScore {
  engagement: number;
  musicTaste: string[];
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
  totalSpent: number;
  nftsOwned: number;
}

interface Recommendation {
  tier: "standard" | "premium" | "vip";
  discount: number; // basis points (e.g., 1000 = 10%)
  reason: string;
  personalizedOffers: string[];
}

// Mock MeTTa AI scoring system
function calculateMeTTaScore(wallet: string): MeTTaScore {
  // In real implementation, this would call MeTTa AI service
  // For demo, we'll generate deterministic scores based on wallet
  const hash = parseInt(wallet.slice(-8), 16);
  
  const engagement = (hash % 100) / 10; // 0-10 score
  const musicTaste = ["electronic", "hip-hop", "rock", "pop"].filter(() => Math.random() > 0.5);
  
  let loyaltyTier: MeTTaScore["loyaltyTier"] = "bronze";
  if (engagement > 7) loyaltyTier = "platinum";
  else if (engagement > 5) loyaltyTier = "gold";
  else if (engagement > 3) loyaltyTier = "silver";
  
  return {
    engagement,
    musicTaste: musicTaste.length > 0 ? musicTaste : ["pop"],
    loyaltyTier,
    totalSpent: engagement * 0.1, // ETH
    nftsOwned: Math.floor(engagement * 2),
  };
}

function generateRecommendation(score: MeTTaScore): Recommendation {
  let tier: Recommendation["tier"] = "standard";
  let discount = 0;
  let reason = "New user recommendation";
  const personalizedOffers: string[] = [];

  switch (score.loyaltyTier) {
    case "platinum":
      tier = "vip";
      discount = 2500; // 25% discount
      reason = "Platinum member - top 5% of collectors";
      personalizedOffers.push("Early access to new drops", "Exclusive artist meet & greets", "Limited edition variants");
      break;
    case "gold":
      tier = "premium";
      discount = 2000; // 20% discount
      reason = "Gold member - highly engaged collector";
      personalizedOffers.push("Priority minting access", "Artist backstage content", "Collector community access");
      break;
    case "silver":
      tier = "premium";
      discount = 1500; // 15% discount
      reason = "Silver member - growing collection";
      personalizedOffers.push("Curated drop recommendations", "Music discovery playlists");
      break;
    default:
      tier = "standard";
      discount = 500; // 5% discount
      reason = "Welcome bonus for new collectors";
      personalizedOffers.push("Beginner's guide to music NFTs");
  }

  // Add taste-based recommendations
  if (score.musicTaste.includes("electronic")) {
    personalizedOffers.push("Electronic music genre drops");
  }
  if (score.musicTaste.includes("hip-hop")) {
    personalizedOffers.push("Hip-hop artist collaborations");
  }

  return {
    tier,
    discount,
    reason,
    personalizedOffers,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { wallet } = req.body;

    if (!wallet || typeof wallet !== "string") {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // Validate wallet format (basic check)
    if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: "Invalid wallet address format" });
    }

    // Calculate MeTTa AI score
    const score = calculateMeTTaScore(wallet);
    
    // Generate recommendation
    const recommendation = generateRecommendation(score);

    // Log for analytics (in real implementation, send to analytics service)
    console.log(`Recommendation generated for ${wallet}:`, {
      score,
      recommendation,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      data: {
        wallet,
        score,
        recommendation,
        timestamp: new Date().toISOString(),
        // Include some metadata for debugging
        metadata: {
          version: "1.0.0",
          provider: "MeTTa AI Mock Service",
        },
      },
    });
  } catch (error) {
    console.error("Recommendation API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to generate recommendation",
    });
  }
}