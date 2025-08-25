import { ethers, deployments } from "hardhat";

async function main() {
  console.log("🚀 Deploying to Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Deploy all contracts
  await deployments.run();

  const musicDrops = await ethers.getContract("MusicDrops");
  const personalizedMinter = await ethers.getContract("PersonalizedMinter");
  const paymentSplitter = await ethers.getContract("MeTTaPaymentSplitter");

  console.log("\n📜 Deployed Contracts:");
  console.log("MusicDrops:", musicDrops.address);
  console.log("PersonalizedMinter:", personalizedMinter.address);
  console.log("PaymentSplitter:", paymentSplitter.address);

  console.log("\n✅ Sepolia deployment complete!");
  console.log("You can verify the contracts on Etherscan using:");
  console.log(`npx hardhat verify --network sepolia ${musicDrops.address} "https://gateway.pinata.cloud/ipfs/"`);
  console.log(`npx hardhat verify --network sepolia ${personalizedMinter.address} "${deployer.address}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });