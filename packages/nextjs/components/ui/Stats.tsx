import { useEffect, useState } from "react";

export const Stats = () => {
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalSales: 0,
    totalArtists: 0,
    totalHolders: 0,
  });

  useEffect(() => {
    // Mock data - in real implementation, fetch from contracts/API
    const mockStats = {
      totalVolume: 1247.8,
      totalSales: 8432,
      totalArtists: 156,
      totalHolders: 3291,
    };
    
    // Animate the numbers
    const interval = setInterval(() => {
      setStats(prev => ({
        totalVolume: Math.min(prev.totalVolume + 12.5, mockStats.totalVolume),
        totalSales: Math.min(prev.totalSales + 85, mockStats.totalSales),
        totalArtists: Math.min(prev.totalArtists + 2, mockStats.totalArtists),
        totalHolders: Math.min(prev.totalHolders + 33, mockStats.totalHolders),
      }));
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setStats(mockStats);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="stats stats-vertical lg:stats-horizontal shadow-xl bg-base-100 w-full">
      <div className="stat">
        <div className="stat-figure text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
            ></path>
          </svg>
        </div>
        <div className="stat-title">Total Volume</div>
        <div className="stat-value text-primary">{stats.totalVolume.toFixed(1)} ETH</div>
        <div className="stat-desc">21% more than last month</div>
      </div>

      <div className="stat">
        <div className="stat-figure text-secondary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            ></path>
          </svg>
        </div>
        <div className="stat-title">Total Sales</div>
        <div className="stat-value text-secondary">{stats.totalSales.toLocaleString()}</div>
        <div className="stat-desc">Music NFTs sold</div>
      </div>

      <div className="stat">
        <div className="stat-figure text-accent">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
          </svg>
        </div>
        <div className="stat-title">Artists</div>
        <div className="stat-value text-accent">{stats.totalArtists}</div>
        <div className="stat-desc">Creating on platform</div>
      </div>

      <div className="stat">
        <div className="stat-figure text-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-8 h-8 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            ></path>
          </svg>
        </div>
        <div className="stat-title">Collectors</div>
        <div className="stat-value text-info">{stats.totalHolders.toLocaleString()}</div>
        <div className="stat-desc">Unique holders</div>
      </div>
    </div>
  );
};