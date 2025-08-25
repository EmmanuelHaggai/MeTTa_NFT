export const FeaturedArtists = () => {
  const artists = [
    {
      name: "ElectroVibe",
      genre: "Electronic",
      followers: "125K",
      image: "https://picsum.photos/200/200?random=10",
      verified: true,
    },
    {
      name: "MetalCore",
      genre: "Metal",
      followers: "89K",
      image: "https://picsum.photos/200/200?random=11",
      verified: true,
    },
    {
      name: "FolkSoul",
      genre: "Folk",
      followers: "67K",
      image: "https://picsum.photos/200/200?random=12",
      verified: false,
    },
    {
      name: "RapLegend",
      genre: "Hip Hop",
      followers: "203K",
      image: "https://picsum.photos/200/200?random=13",
      verified: true,
    },
  ];

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Featured Artists</h2>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Discover incredible artists creating unique music experiences
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {artists.map((artist) => (
          <div key={artist.name} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <figure className="px-6 pt-6">
              <div className="avatar">
                <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={artist.image} alt={artist.name} />
                </div>
              </div>
            </figure>
            <div className="card-body items-center text-center">
              <div className="flex items-center gap-2">
                <h3 className="card-title text-lg">{artist.name}</h3>
                {artist.verified && (
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm opacity-70">{artist.genre}</p>
              <p className="text-xs opacity-50">{artist.followers} followers</p>
              <div className="card-actions">
                <button className="btn btn-primary btn-sm">Follow</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};