import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer, artist } = await getNamedAccounts();

  const baseURI = "https://gateway.pinata.cloud/ipfs/";

  console.log("Deploying MusicDrops contract...");
  const musicDrops = await deploy("MusicDrops", {
    from: deployer,
    args: [baseURI],
    log: true,
    autoMine: true,
  });

  console.log("Deploying PersonalizedMinter contract...");
  const personalizedMinter = await deploy("PersonalizedMinter", {
    from: deployer,
    args: [deployer], // Use deployer as initial trusted signer
    log: true,
    autoMine: true,
  });

  // Deploy a demo PaymentSplitter
  const payees = [artist, deployer];
  const shares = [70, 30]; // 70% to artist, 30% to platform

  console.log("Deploying PaymentSplitter contract...");
  const paymentSplitter = await deploy("MeTTaPaymentSplitter", {
    from: deployer,
    args: [payees, shares],
    log: true,
    autoMine: true,
  });

  // Grant roles
  console.log("Setting up roles...");
  const musicDropsContract = await ethers.getContract("MusicDrops", deployer);
  
  const ARTIST_ROLE = await musicDropsContract.ARTIST_ROLE();
  const ADMIN_ROLE = await musicDropsContract.ADMIN_ROLE();

  console.log("Granting ARTIST_ROLE to artist...");
  await musicDropsContract.grantRole(ARTIST_ROLE, artist);
  
  console.log("Granting ADMIN_ROLE to artist...");
  await musicDropsContract.grantRole(ADMIN_ROLE, artist);

  console.log("\n🎵 MeTTa Music Drops deployed!");
  console.log("📜 MusicDrops:", musicDrops.address);
  console.log("🎨 PersonalizedMinter:", personalizedMinter.address);
  console.log("💰 PaymentSplitter:", paymentSplitter.address);
  console.log("👨‍🎤 Artist:", artist);
  console.log("🚀 Deployer:", deployer);
};

export default deployContracts;
deployContracts.tags = ["MusicDrops", "PersonalizedMinter", "PaymentSplitter"];