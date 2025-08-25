import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useAccount } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { DropsPreview } from "~~/components/music/DropsPreview";
import { FeaturedArtists } from "~~/components/music/FeaturedArtists";
import { Stats } from "~~/components/ui/Stats";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <div className="hero min-h-[60vh] bg-gradient-to-r from-primary to-secondary rounded-3xl">
            <div className="hero-content text-center text-white">
              <div className="max-w-4xl">
                <h1 className="mb-8 text-6xl font-bold leading-tight">
                  Own Your Music.
                  <br />
                  <span className="text-accent">Not Just Stream It.</span>
                </h1>
                <p className="mb-8 text-xl opacity-90 max-w-2xl mx-auto">
                  MeTTa Music Drops lets artists mint music NFTs and fans truly own rare editions, 
                  concert passes, and behind-the-scenes content with programmable royalties and token-gated utilities.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link href="/drops" className="btn btn-accent btn-lg">
                    Browse Drops
                  </Link>
                  <Link href="/studio" className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
                    Create Music NFT
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-5 py-16">
          <Stats />
        </div>

        <div className="container mx-auto px-5 py-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Music Drops</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Discover the latest releases from your favorite artists
            </p>
          </div>
          <DropsPreview />
        </div>

        <div className="container mx-auto px-5 py-16">
          <FeaturedArtists />
        </div>

        <div className="bg-base-200 w-full py-16">
          <div className="container mx-auto px-5">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Why MeTTa Music?</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="card-title justify-center">True Ownership</h3>
                  <p>Own your music NFTs forever. No monthly subscriptions, no losing access.</p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body text-center">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="card-title justify-center">Token-Gated Utilities</h3>
                  <p>Unlock exclusive content, concert access, and special perks with your NFTs.</p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body text-center">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="card-title justify-center">AI Personalization</h3>
                  <p>Get personalized drops and discounts based on your music taste and engagement.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;