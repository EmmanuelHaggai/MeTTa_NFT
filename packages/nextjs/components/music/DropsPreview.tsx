import { useState, useEffect } from "react";
import Link from "next/link";
import { formatEther } from "viem";

interface Drop {
  id: number;
  title: string;
  artist: string;
  price: string;
  supply: number;
  remaining: number;
  image: string;
  type: "music" | "vip";
  endTime: number;
}

export const DropsPreview = () => {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real implementation, fetch from contracts
    const mockDrops: Drop[] = [
      {
        id: 1,
        title: "Neon Dreams EP",
        artist: "ElectroVibe",
        price: "0.01",
        supply: 5000,
        remaining: 4237,
        image: "https://picsum.photos/400/400?random=1",
        type: "music",
        endTime: Date.now() + 86400000 * 7, // 7 days
      },
      {
        id: 2,
        title: "VIP Concert Pass",
        artist: "MetalCore",
        price: "0.05",
        supply: 250,
        remaining: 87,
        image: "https://picsum.photos/400/400?random=2",
        type: "vip",
        endTime: Date.now() + 86400000 * 3, // 3 days
      },
      {
        id: 3,
        title: "Acoustic Sessions",
        artist: "FolkSoul",
        price: "0.008",
        supply: 1000,
        remaining: 623,
        image: "https://picsum.photos/400/400?random=3",
        type: "music",
        endTime: Date.now() + 86400000 * 10, // 10 days
      },
    ];
    
    setTimeout(() => {
      setDrops(mockDrops);
      setLoading(false);
    }, 1000);
  }, []);

  const getTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow-xl animate-pulse">
            <div className="bg-gray-300 h-64 w-full"></div>
            <div className="card-body">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {drops.map((drop) => (
        <div key={drop.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <figure className="relative">
            <img src={drop.image} alt={drop.title} className="w-full h-64 object-cover" />
            <div className="absolute top-4 right-4">
              <div className={`badge ${drop.type === 'vip' ? 'badge-secondary' : 'badge-primary'}`}>
                {drop.type === 'vip' ? 'VIP' : 'MUSIC'}
              </div>
            </div>
          </figure>
          <div className="card-body">
            <h3 className="card-title">{drop.title}</h3>
            <p className="text-sm opacity-70">by {drop.artist}</p>
            
            <div className="flex justify-between items-center my-2">
              <span className="font-bold text-lg">{drop.price} ETH</span>
              <span className="text-sm opacity-70">
                {drop.remaining}/{drop.supply} left
              </span>
            </div>
            
            <div className="progress progress-primary w-full">
              <div 
                className="progress progress-primary" 
                style={{ width: `${((drop.supply - drop.remaining) / drop.supply) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs opacity-70">
                Ends in {getTimeRemaining(drop.endTime)}
              </span>
            </div>
            
            <div className="card-actions justify-end mt-4">
              <Link href={`/drops/${drop.id}`} className="btn btn-primary">
                View Drop
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};