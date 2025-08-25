import { ethers } from "hardhat";

async function main() {
  const [deployer, artist, fan1, fan2, fan3] = await ethers.getSigners();
  
  console.log("Generating personalized mint vouchers...");
  
  const personalizedMinter = await ethers.getContract("PersonalizedMinter");
  
  const domain = {
    name: "MeTTaPersonalizedMinter",
    version: "1",
    chainId: await personalizedMinter.getChainId(),
    verifyingContract: personalizedMinter.address,
  };

  const types = {
    MintVoucher: [
      { name: "collection", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "wallet", type: "address" },
      { name: "price", type: "uint256" },
      { name: "discountBps", type: "uint256" },
      { name: "maxQuantity", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const musicDrops = await ethers.getContract("MusicDrops");
  const now = Math.floor(Date.now() / 1000);
  const oneWeek = 60 * 60 * 24 * 7;

  const vouchers = [
    {
      collection: musicDrops.address,
      tokenId: 1,
      wallet: fan1.address,
      price: ethers.utils.parseEther("0.01"),
      discountBps: 2000, // 20% discount
      maxQuantity: 5,
      startTime: now,
      endTime: now + oneWeek,
      nonce: 1,
    },
    {
      collection: musicDrops.address,
      tokenId: 1,
      wallet: fan2.address,
      price: ethers.utils.parseEther("0.01"),
      discountBps: 1500, // 15% discount
      maxQuantity: 3,
      startTime: now,
      endTime: now + oneWeek,
      nonce: 2,
    },
    {
      collection: musicDrops.address,
      tokenId: 2,
      wallet: fan3.address,
      price: ethers.utils.parseEther("0.05"),
      discountBps: 1000, // 10% discount
      maxQuantity: 1,
      startTime: now,
      endTime: now + oneWeek,
      nonce: 3,
    },
  ];

  console.log("Generated vouchers:");
  for (const voucher of vouchers) {
    const signature = await deployer._signTypedData(domain, types, voucher);
    
    console.log(`\nVoucher for ${voucher.wallet}:`);
    console.log(`  Token ID: ${voucher.tokenId}`);
    console.log(`  Max Quantity: ${voucher.maxQuantity}`);
    console.log(`  Discount: ${voucher.discountBps / 100}%`);
    console.log(`  Final Price: ${ethers.utils.formatEther(voucher.price.mul(10000 - voucher.discountBps).div(10000))} ETH`);
    console.log(`  Signature: ${signature}`);
    console.log(`  Nonce: ${voucher.nonce}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });