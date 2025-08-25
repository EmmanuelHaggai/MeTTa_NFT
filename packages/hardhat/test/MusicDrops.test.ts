import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MusicDrops, PersonalizedMinter, MeTTaPaymentSplitter } from "../typechain-types";

describe("MusicDrops", function () {
  let musicDrops: MusicDrops;
  let personalizedMinter: PersonalizedMinter;
  let paymentSplitter: MeTTaPaymentSplitter;
  let deployer: SignerWithAddress;
  let artist: SignerWithAddress;
  let fan1: SignerWithAddress;
  let fan2: SignerWithAddress;

  const baseURI = "https://gateway.pinata.cloud/ipfs/";
  const dropPrice = ethers.utils.parseEther("0.01");
  const maxSupply = 1000;
  const maxPerWallet = 5;

  beforeEach(async function () {
    await deployments.fixture(["MusicDrops", "PersonalizedMinter", "PaymentSplitter"]);
    
    [deployer, artist, fan1, fan2] = await ethers.getSigners();
    
    musicDrops = await ethers.getContract("MusicDrops", deployer);
    personalizedMinter = await ethers.getContract("PersonalizedMinter", deployer);
    paymentSplitter = await ethers.getContract("MeTTaPaymentSplitter", deployer);

    // Grant artist role
    const ARTIST_ROLE = await musicDrops.ARTIST_ROLE();
    await musicDrops.grantRole(ARTIST_ROLE, artist.address);
  });

  describe("Drop Creation", function () {
    it("Should create an ERC1155 drop", async function () {
      const now = Math.floor(Date.now() / 1000);
      const endTime = now + 3600; // 1 hour
      
      const tx = await musicDrops.connect(artist).createDrop(
        0, // ERC1155
        dropPrice,
        maxSupply,
        maxPerWallet,
        now,
        endTime,
        ethers.constants.HashZero,
        "ipfs://test",
        paymentSplitter.address,
        500 // 5% royalty
      );
      
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === "DropCreated");
      
      expect(event?.args?.tokenId).to.equal(1);
      expect(event?.args?.tokenType).to.equal(0);
      expect(event?.args?.price).to.equal(dropPrice);
      expect(event?.args?.maxSupply).to.equal(maxSupply);
    });

    it("Should create an ERC721 drop", async function () {
      const now = Math.floor(Date.now() / 1000);
      const endTime = now + 3600;
      
      await musicDrops.connect(artist).createDrop(
        1, // ERC721
        dropPrice,
        100,
        2,
        now,
        endTime,
        ethers.constants.HashZero,
        "ipfs://test721",
        paymentSplitter.address,
        750 // 7.5% royalty
      );
      
      const drop = await musicDrops.drops(1);
      expect(drop.tokenType).to.equal(1);
      expect(drop.maxSupply).to.equal(100);
    });

    it("Should fail if not artist", async function () {
      const now = Math.floor(Date.now() / 1000);
      
      await expect(
        musicDrops.connect(fan1).createDrop(
          0,
          dropPrice,
          maxSupply,
          maxPerWallet,
          now,
          now + 3600,
          ethers.constants.HashZero,
          "ipfs://test",
          paymentSplitter.address,
          500
        )
      ).to.be.reverted;
    });
  });

  describe("Public Minting", function () {
    let tokenId: number;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const tx = await musicDrops.connect(artist).createDrop(
        0, // ERC1155
        dropPrice,
        maxSupply,
        maxPerWallet,
        now,
        now + 3600,
        ethers.constants.HashZero,
        "ipfs://test",
        paymentSplitter.address,
        500
      );
      tokenId = 1;
    });

    it("Should mint ERC1155 tokens", async function () {
      const quantity = 3;
      const totalCost = dropPrice.mul(quantity);
      
      await expect(
        musicDrops.connect(fan1).mintPublic(tokenId, quantity, { value: totalCost })
      ).to.emit(musicDrops, "TokenMinted")
        .withArgs(tokenId, fan1.address, quantity, totalCost, 0);
      
      expect(await musicDrops.balanceOf(fan1.address, tokenId)).to.equal(quantity);
    });

    it("Should enforce per-wallet limits", async function () {
      const quantity = maxPerWallet + 1;
      const totalCost = dropPrice.mul(quantity);
      
      await expect(
        musicDrops.connect(fan1).mintPublic(tokenId, quantity, { value: totalCost })
      ).to.be.revertedWithCustomError(musicDrops, "MaxPerWalletExceeded");
    });

    it("Should enforce supply limits", async function () {
      // Create a drop with small supply
      const now = Math.floor(Date.now() / 1000);
      await musicDrops.connect(artist).createDrop(
        0,
        dropPrice,
        2, // only 2 supply
        5,
        now,
        now + 3600,
        ethers.constants.HashZero,
        "ipfs://test",
        paymentSplitter.address,
        500
      );
      
      const smallSupplyTokenId = 2;
      const quantity = 3;
      const totalCost = dropPrice.mul(quantity);
      
      await expect(
        musicDrops.connect(fan1).mintPublic(smallSupplyTokenId, quantity, { value: totalCost })
      ).to.be.revertedWithCustomError(musicDrops, "MaxSupplyExceeded");
    });

    it("Should require correct payment", async function () {
      const quantity = 2;
      const insufficientPayment = dropPrice;
      
      await expect(
        musicDrops.connect(fan1).mintPublic(tokenId, quantity, { value: insufficientPayment })
      ).to.be.revertedWithCustomError(musicDrops, "InsufficientPayment");
    });

    it("Should refund excess payment", async function () {
      const quantity = 1;
      const totalCost = dropPrice.mul(quantity);
      const excessPayment = totalCost.mul(2);
      
      const initialBalance = await fan1.getBalance();
      const tx = await musicDrops.connect(fan1).mintPublic(tokenId, quantity, { value: excessPayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      const finalBalance = await fan1.getBalance();
      const expectedBalance = initialBalance.sub(totalCost).sub(gasUsed);
      
      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.utils.parseEther("0.001"));
    });
  });

  describe("Utilities", function () {
    let tokenId: number;
    let utilityId: number;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      await musicDrops.connect(artist).createDrop(
        0,
        dropPrice,
        maxSupply,
        maxPerWallet,
        now,
        now + 3600,
        ethers.constants.HashZero,
        "ipfs://test",
        paymentSplitter.address,
        500
      );
      tokenId = 1;
      
      const utilityTx = await musicDrops.connect(artist).createUtility(
        tokenId,
        "Exclusive Content",
        "Access to unreleased tracks"
      );
      utilityId = 1;
    });

    it("Should create utility", async function () {
      const utility = await musicDrops.utilities(utilityId);
      expect(utility.name).to.equal("Exclusive Content");
      expect(utility.description).to.equal("Access to unreleased tracks");
      expect(utility.active).to.be.true;
      expect(utility.tokenId).to.equal(tokenId);
    });

    it("Should allow token holders to redeem utility", async function () {
      // First mint a token
      await musicDrops.connect(fan1).mintPublic(tokenId, 1, { value: dropPrice });
      
      // Then redeem utility
      await expect(
        musicDrops.connect(fan1).redeemUtility(utilityId)
      ).to.emit(musicDrops, "UtilityRedeemed")
        .withArgs(utilityId, tokenId, fan1.address);
      
      expect(await musicDrops.utilityRedeemed(utilityId, fan1.address)).to.be.true;
    });

    it("Should prevent non-holders from redeeming utility", async function () {
      await expect(
        musicDrops.connect(fan1).redeemUtility(utilityId)
      ).to.be.revertedWithCustomError(musicDrops, "NoTokenAccess");
    });

    it("Should prevent double redemption", async function () {
      await musicDrops.connect(fan1).mintPublic(tokenId, 1, { value: dropPrice });
      await musicDrops.connect(fan1).redeemUtility(utilityId);
      
      await expect(
        musicDrops.connect(fan1).redeemUtility(utilityId)
      ).to.be.revertedWithCustomError(musicDrops, "UtilityAlreadyRedeemed");
    });
  });

  describe("Royalties", function () {
    it("Should return correct royalty info", async function () {
      const now = Math.floor(Date.now() / 1000);
      await musicDrops.connect(artist).createDrop(
        0,
        dropPrice,
        maxSupply,
        maxPerWallet,
        now,
        now + 3600,
        ethers.constants.HashZero,
        "ipfs://test",
        paymentSplitter.address,
        500 // 5%
      );
      
      const salePrice = ethers.utils.parseEther("1");
      const [receiver, royaltyAmount] = await musicDrops.royaltyInfo(1, salePrice);
      
      expect(receiver).to.equal(paymentSplitter.address);
      expect(royaltyAmount).to.equal(salePrice.mul(500).div(10000)); // 5%
    });
  });

  describe("Metadata", function () {
    let tokenId: number;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      await musicDrops.connect(artist).createDrop(
        0,
        dropPrice,
        maxSupply,
        maxPerWallet,
        now,
        now + 3600,
        ethers.constants.HashZero,
        "ipfs://test-metadata",
        paymentSplitter.address,
        500
      );
      tokenId = 1;
    });

    it("Should return metadata URI", async function () {
      const uri = await musicDrops.uri(tokenId);
      expect(uri).to.equal("ipfs://test-metadata");
    });

    it("Should allow metadata updates", async function () {
      const newURI = "ipfs://new-metadata";
      
      await expect(
        musicDrops.connect(artist).updateMetadata(tokenId, newURI)
      ).to.emit(musicDrops, "MetadataUpdated")
        .withArgs(tokenId, newURI);
      
      expect(await musicDrops.uri(tokenId)).to.equal(newURI);
    });

    it("Should freeze metadata", async function () {
      await musicDrops.connect(artist).freezeMetadata(tokenId);
      
      await expect(
        musicDrops.connect(artist).updateMetadata(tokenId, "ipfs://should-fail")
      ).to.be.revertedWithCustomError(musicDrops, "MetadataFrozen");
    });
  });

  describe("Payment Splitting", function () {
    it("Should distribute payments correctly", async function () {
      const now = Math.floor(Date.now() / 1000);
      await musicDrops.connect(artist).createDrop(
        0,
        dropPrice,
        maxSupply,
        maxPerWallet,
        now,
        now + 3600,
        ethers.constants.HashZero,
        "ipfs://test",
        paymentSplitter.address,
        500
      );
      
      const quantity = 2;
      const totalCost = dropPrice.mul(quantity);
      
      const initialSplitterBalance = await ethers.provider.getBalance(paymentSplitter.address);
      
      await musicDrops.connect(fan1).mintPublic(1, quantity, { value: totalCost });
      
      const finalSplitterBalance = await ethers.provider.getBalance(paymentSplitter.address);
      expect(finalSplitterBalance.sub(initialSplitterBalance)).to.equal(totalCost);
    });
  });

  describe("Access Control", function () {
    it("Should grant and revoke roles", async function () {
      const ARTIST_ROLE = await musicDrops.ARTIST_ROLE();
      
      expect(await musicDrops.hasRole(ARTIST_ROLE, artist.address)).to.be.true;
      
      await musicDrops.revokeRole(ARTIST_ROLE, artist.address);
      expect(await musicDrops.hasRole(ARTIST_ROLE, artist.address)).to.be.false;
    });
  });

  describe("Gas Usage", function () {
    it("Should track gas usage for minting", async function () {
      const now = Math.floor(Date.now() / 1000);
      await musicDrops.connect(artist).createDrop(
        0,
        dropPrice,
        maxSupply,
        maxPerWallet,
        now,
        now + 3600,
        ethers.constants.HashZero,
        "ipfs://test",
        paymentSplitter.address,
        500
      );
      
      const tx = await musicDrops.connect(fan1).mintPublic(1, 1, { value: dropPrice });
      const receipt = await tx.wait();
      
      console.log(`Gas used for ERC1155 mint: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed.toNumber()).to.be.below(200000); // Should be gas efficient
    });
  });
});