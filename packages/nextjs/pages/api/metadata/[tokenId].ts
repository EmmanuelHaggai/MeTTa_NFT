import { NextApiRequest, NextApiResponse } from "next";

interface DynamicMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

// Mock user data - in production, fetch from database/blockchain
const USER_DATA: Record<string, any> = {
  // This would be populated from user activity, purchases, engagement, etc.
};

function generateDynamicTraits(tokenId: string, wallet?: string): Array<{ trait_type: string; value: string | number; display_type?: string }> {
  const traits: Array<{ trait_type: string; value: string | number; display_type?: string }> = [];
  
  // Static traits based on token ID
  if (tokenId === "1") {
    traits.push(
      { trait_type: "Type", value: "Music NFT" },
      { trait_type: "Genre", value: "Electronic" },
      { trait_type: "Edition Size", value: 5000, display_type: "number" },
    );
  } else if (tokenId === "2") {
    traits.push(
      { trait_type: "Type", value: "VIP Pass" },
      { trait_type: "Access Level", value: "Backstage" },
      { trait_type: "Edition Size", value: 250, display_type: "number" },
    );
  }

  // Add dynamic traits if wallet is provided and user has special status
  if (wallet) {
    const userData = USER_DATA[wallet.toLowerCase()];
    
    // Mock some dynamic traits based on user activity
    const hash = parseInt(wallet.slice(-8), 16);
    const engagement = hash % 100;
    
    if (engagement > 80) {
      traits.push({ trait_type: "Fan Level", value: "Super Fan" });
    } else if (engagement > 50) {
      traits.push({ trait_type: "Fan Level", value: "Top Fan" });
    }
    
    // Add traits based on collection behavior
    if (engagement > 60) {
      traits.push({ trait_type: "Collector Status", value: "Early Adopter" });
    }
    
    // Time-based traits
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    traits.push(
      { trait_type: "Mint Month", value: currentMonth, display_type: "number" },
      { trait_type: "Mint Year", value: currentYear, display_type: "number" },
    );

    // Add special event traits (example: if user attended a concert)
    if (tokenId === "2" && engagement > 70) {
      traits.push({ trait_type: "Concert Attendance", value: "Tour 2025" });
    }
  }

  return traits;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tokenId, wallet, signed } = req.query;

  if (!tokenId || Array.isArray(tokenId)) {
    return res.status(400).json({ error: "Invalid token ID" });
  }

  try {
    // Base metadata
    const baseMetadata: DynamicMetadata = {
      name: `MeTTa Music Drop #${tokenId}`,
      description: "A unique music NFT from MeTTa Music Drops platform",
      image: `https://gateway.pinata.cloud/ipfs/QmYourImageHash${tokenId}`,
      attributes: [],
    };

    // Customize metadata based on token ID
    if (tokenId === "1") {
      baseMetadata.name = "Neon Dreams EP";
      baseMetadata.description = "An exclusive electronic music collection featuring unreleased tracks and behind-the-scenes content from ElectroVibe";
      baseMetadata.animation_url = "https://gateway.pinata.cloud/ipfs/QmYourAnimationHash1";
      baseMetadata.external_url = "https://metta-music-drops.vercel.app/drops/1";
    } else if (tokenId === "2") {
      baseMetadata.name = "VIP Concert Pass";
      baseMetadata.description = "Exclusive VIP access pass granting backstage access, meet & greet opportunities, and special perks for MetalCore concerts";
      baseMetadata.external_url = "https://metta-music-drops.vercel.app/drops/2";
    }

    // Generate dynamic traits
    const dynamicTraits = generateDynamicTraits(tokenId, wallet as string);
    baseMetadata.attributes = dynamicTraits;

    // If this is a signed request for protected metadata, add additional traits
    if (signed === "true" && wallet) {
      // In production, verify the signature here
      // For demo, we'll just add some exclusive traits
      baseMetadata.attributes.push(
        { trait_type: "Access Level", value: "Token Gated" },
        { trait_type: "Exclusive Content", value: "Available" }
      );
      
      // Add utility-specific metadata
      if (tokenId === "1") {
        baseMetadata.attributes.push(
          { trait_type: "Utility", value: "Exclusive Track Access" },
          { trait_type: "Tracks Available", value: 8, display_type: "number" }
        );
      } else if (tokenId === "2") {
        baseMetadata.attributes.push(
          { trait_type: "Utility", value: "Concert VIP Access" },
          { trait_type: "Events Access", value: "Tour 2025" }
        );
      }
    }

    // Set appropriate cache headers
    const cacheTime = signed === "true" ? 300 : 3600; // 5 min for dynamic, 1 hour for static
    res.setHeader("Cache-Control", `public, s-maxage=${cacheTime}`);
    res.setHeader("Content-Type", "application/json");

    res.status(200).json(baseMetadata);
  } catch (error) {
    console.error("Metadata API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to generate metadata",
    });
  }
}