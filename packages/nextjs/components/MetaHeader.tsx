import Head from "next/head";

type MetaHeaderProps = {
  title?: string;
  description?: string;
  image?: string;
  twitterCard?: string;
  children?: React.ReactNode;
};

export const MetaHeader = ({
  title = "MeTTa Music Drops",
  description = "A dapp for music NFT drops with MeTTa AI personalization. Own your music, not just stream it.",
  image = "https://metta-music-drops.vercel.app/og-image.png",
  twitterCard = "summary_large_image",
  children,
}: MetaHeaderProps) => {
  return (
    <Head>
      {title && (
        <>
          <title>{title}</title>
          <meta property="og:title" content={title} />
          <meta name="twitter:title" content={title} />
        </>
      )}
      {description && (
        <>
          <meta name="description" content={description} />
          <meta property="og:description" content={description} />
          <meta name="twitter:description" content={description} />
        </>
      )}
      {image && (
        <>
          <meta property="og:image" content={image} />
          <meta name="twitter:image" content={image} />
        </>
      )}
      {twitterCard && <meta name="twitter:card" content={twitterCard} />}
      <link rel="icon" href="/favicon.ico" />
      {children}
    </Head>
  );
};