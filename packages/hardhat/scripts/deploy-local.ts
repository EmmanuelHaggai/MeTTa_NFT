import { ethers, deployments } from "hardhat";

async function main() {
  console.log("🚀 Deploying to Local Network...");
  
  const [deployer, artist, fan1, fan2, fan3] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy all contracts
  await deployments.run();

  const musicDrops = await ethers.getContract("MusicDrops");
  const personalizedMinter = await ethers.getContract("PersonalizedMinter");
  const paymentSplitter = await ethers.getContract("MeTTaPaymentSplitter");

  console.log("\n📜 Deployed Contracts:");
  console.log("MusicDrops:", musicDrops.address);
  console.log("PersonalizedMinter:", personalizedMinter.address);
  console.log("PaymentSplitter:", paymentSplitter.address);

  console.log("\n👥 Test Accounts:");
  console.log("Deployer:", deployer.address);
  console.log("Artist:", artist.address);
  console.log("Fan 1:", fan1.address);
  console.log("Fan 2:", fan2.address);
  console.log("Fan 3:", fan3.address);

  // Fund test accounts with ETH
  const fundAmount = ethers.utils.parseEther("10");
  
  console.log("\n💰 Funding test accounts...");
  await deployer.sendTransaction({ to: artist.address, value: fundAmount });
  await deployer.sendTransaction({ to: fan1.address, value: fundAmount });
  await deployer.sendTransaction({ to: fan2.address, value: fundAmount });
  await deployer.sendTransaction({ to: fan3.address, value: fundAmount });

  console.log("✅ Test accounts funded with 10 ETH each");

  // Create some test mints for demonstration
  console.log("\n🎵 Creating test mints...");
  
  // Mint some tokens to fans for testing
  const musicPrice = ethers.utils.parseEther("0.01");
  const vipPrice = ethers.utils.parseEther("0.05");

  try {
    // Fan 1 mints music NFT
    await musicDrops.connect(fan1).mintPublic(1, 2, { value: musicPrice.mul(2) });
    console.log("✅ Fan 1 minted 2x Music NFT (Token ID 1)");

    // Fan 2 mints VIP pass
    await musicDrops.connect(fan2).mintPublic(2, 1, { value: vipPrice });
    console.log("✅ Fan 2 minted 1x VIP Pass (Token ID 2)");

    // Fan 3 mints music NFT
    await musicDrops.connect(fan3).mintPublic(1, 1, { value: musicPrice });
    console.log("✅ Fan 3 minted 1x Music NFT (Token ID 1)");
  } catch (error) {
    console.log("⚠️ Test minting skipped (drops may not be active)");
  }

  console.log("\n🌐 Local Environment Ready!");
  console.log("Frontend URL: http://localhost:3000");
  console.log("Hardhat Network: http://localhost:8545");
  console.log("Chain ID: 31337");

  console.log("\n🔧 Environment Variables for Frontend:");
  console.log(`NEXT_PUBLIC_MUSIC_DROPS_ADDRESS=${musicDrops.address}`);
  console.log(`NEXT_PUBLIC_PERSONALIZED_MINTER_ADDRESS=${personalizedMinter.address}`);
  console.log(`NEXT_PUBLIC_PAYMENT_SPLITTER_ADDRESS=${paymentSplitter.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });