import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const setupDemoDrops: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, ethers } = hre;
  const { artist } = await getNamedAccounts();

  console.log("Setting up demo drops...");

  const musicDrops = await ethers.getContract("MusicDrops", artist);
  const paymentSplitter = await ethers.getContract("MeTTaPaymentSplitter");

  const now = Math.floor(Date.now() / 1000);
  const oneHour = 60 * 60;
  const oneWeek = oneHour * 24 * 7;

  // Create ERC1155 Music Drop (5000 editions)
  console.log("Creating ERC1155 music drop...");
  const musicDropTx = await musicDrops.createDrop(
    0, // ERC1155
    ethers.utils.parseEther("0.01"), // 0.01 ETH
    5000, // max supply
    10, // max per wallet
    now, // start now
    now + oneWeek, // end in 1 week
    ethers.constants.HashZero, // no allowlist
    "ipfs://QmYourMusicMetadataHash", // metadata URI
    paymentSplitter.address,
    500 // 5% royalty
  );
  await musicDropTx.wait();

  // Create ERC721 VIP Pass Drop (250 editions)
  console.log("Creating ERC721 VIP pass drop...");
  const vipDropTx = await musicDrops.createDrop(
    1, // ERC721
    ethers.utils.parseEther("0.05"), // 0.05 ETH
    250, // max supply
    2, // max per wallet
    now + oneHour, // start in 1 hour
    now + oneWeek, // end in 1 week
    ethers.constants.HashZero, // no allowlist
    "ipfs://QmYourVIPMetadataHash", // metadata URI
    paymentSplitter.address,
    750 // 7.5% royalty
  );
  await vipDropTx.wait();

  // Create utilities
  console.log("Creating utilities...");
  
  const musicUtilityTx = await musicDrops.createUtility(
    1, // token ID 1 (music drop)
    "Exclusive Track Access",
    "Access to unreleased tracks and behind-the-scenes content"
  );
  await musicUtilityTx.wait();

  const vipUtilityTx = await musicDrops.createUtility(
    2, // token ID 2 (VIP drop)
    "Concert VIP Access",
    "VIP access to concerts and meet & greets"
  );
  await vipUtilityTx.wait();

  console.log("✅ Demo drops and utilities created!");
  console.log("🎵 Music Drop (Token ID 1): ERC1155, 5000 supply, 0.01 ETH");
  console.log("🎫 VIP Pass (Token ID 2): ERC721, 250 supply, 0.05 ETH");
};

export default setupDemoDrops;
setupDemoDrops.tags = ["DemoDrops"];
setupDemoDrops.dependencies = ["MusicDrops"];