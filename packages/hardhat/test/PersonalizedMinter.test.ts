import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MusicDrops, PersonalizedMinter, MeTTaPaymentSplitter } from "../typechain-types";

describe("PersonalizedMinter", function () {
  let musicDrops: MusicDrops;
  let personalizedMinter: PersonalizedMinter;
  let paymentSplitter: MeTTaPaymentSplitter;
  let deployer: SignerWithAddress;
  let artist: SignerWithAddress;
  let fan1: SignerWithAddress;
  let fan2: SignerWithAddress;

  const dropPrice = ethers.utils.parseEther("0.01");

  beforeEach(async function () {
    await deployments.fixture();
    
    [deployer, artist, fan1, fan2] = await ethers.getSigners();
    
    musicDrops = await ethers.getContract("MusicDrops", deployer);
    personalizedMinter = await ethers.getContract("PersonalizedMinter", deployer);
    paymentSplitter = await ethers.getContract("MeTTaPaymentSplitter", deployer);

    const ARTIST_ROLE = await musicDrops.ARTIST_ROLE();
    await musicDrops.grantRole(ARTIST_ROLE, artist.address);

    // Create a test drop
    const now = Math.floor(Date.now() / 1000);
    await musicDrops.connect(artist).createDrop(
      0, // ERC1155
      dropPrice,
      1000,
      10,
      now,
      now + 3600,
      ethers.constants.HashZero,
      "ipfs://test",
      paymentSplitter.address,
      500
    );
  });

  describe("Voucher Creation and Verification", function () {
    it("Should create and verify valid voucher", async function () {
      const now = Math.floor(Date.now() / 1000);
      const voucher = {
        collection: musicDrops.address,
        tokenId: 1,
        wallet: fan1.address,
        price: dropPrice,
        discountBps: 1000, // 10%
        maxQuantity: 3,
        startTime: now,
        endTime: now + 3600,
        nonce: 1,
      };

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

      const signature = await deployer._signTypedData(domain, types, voucher);
      
      const voucherWithSig = { ...voucher, signature };
      
      const remainingAllowance = await personalizedMinter.getRemainingAllowance(
        fan1.address,
        1,
        voucherWithSig
      );
      
      expect(remainingAllowance).to.equal(3);
    });

    it("Should reject invalid signature", async function () {
      const now = Math.floor(Date.now() / 1000);
      const voucher = {
        collection: musicDrops.address,
        tokenId: 1,
        wallet: fan1.address,
        price: dropPrice,
        discountBps: 1000,
        maxQuantity: 3,
        startTime: now,
        endTime: now + 3600,
        nonce: 1,
        signature: "0x1234", // Invalid signature
      };

      await expect(
        personalizedMinter.connect(fan1).mintWithVoucher(voucher, 1, { value: dropPrice })
      ).to.be.revertedWithCustomError(personalizedMinter, "InvalidSignature");
    });
  });

  describe("Personalized Minting", function () {
    let validVoucher: any;

    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      const voucher = {
        collection: musicDrops.address,
        tokenId: 1,
        wallet: fan1.address,
        price: dropPrice,
        discountBps: 2000, // 20% discount
        maxQuantity: 5,
        startTime: now,
        endTime: now + 3600,
        nonce: 1,
      };

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

      const signature = await deployer._signTypedData(domain, types, voucher);
      validVoucher = { ...voucher, signature };
    });

    it("Should mint with discount", async function () {
      const quantity = 2;
      const discountedPrice = dropPrice.mul(8000).div(10000); // 20% discount
      const totalCost = discountedPrice.mul(quantity);

      await expect(
        personalizedMinter.connect(fan1).mintWithVoucher(validVoucher, quantity, { value: totalCost })
      ).to.emit(personalizedMinter, "PersonalizedMint")
        .withArgs(musicDrops.address, 1, fan1.address, quantity, discountedPrice, 1);

      expect(await musicDrops.balanceOf(fan1.address, 1)).to.equal(quantity);
    });

    it("Should enforce voucher quantity limits", async function () {
      const quantity = 6; // Exceeds max quantity of 5
      const discountedPrice = dropPrice.mul(8000).div(10000);
      const totalCost = discountedPrice.mul(quantity);

      await expect(
        personalizedMinter.connect(fan1).mintWithVoucher(validVoucher, quantity, { value: totalCost })
      ).to.be.revertedWithCustomError(personalizedMinter, "ExceedsMaxQuantity");
    });

    it("Should prevent nonce reuse", async function () {
      const quantity = 1;
      const discountedPrice = dropPrice.mul(8000).div(10000);
      const totalCost = discountedPrice.mul(quantity);

      // First mint should succeed
      await personalizedMinter.connect(fan1).mintWithVoucher(validVoucher, quantity, { value: totalCost });

      // Second mint with same nonce should fail
      await expect(
        personalizedMinter.connect(fan1).mintWithVoucher(validVoucher, quantity, { value: totalCost })
      ).to.be.revertedWithCustomError(personalizedMinter, "NonceAlreadyUsed");
    });

    it("Should enforce time windows", async function () {
      // Create expired voucher
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const expiredVoucher = {
        ...validVoucher,
        startTime: pastTime - 1800,
        endTime: pastTime,
        nonce: 2,
      };

      // Re-sign with new times
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

      const signature = await deployer._signTypedData(domain, types, expiredVoucher);
      expiredVoucher.signature = signature;

      const quantity = 1;
      const discountedPrice = dropPrice.mul(8000).div(10000);
      const totalCost = discountedPrice.mul(quantity);

      await expect(
        personalizedMinter.connect(fan1).mintWithVoucher(expiredVoucher, quantity, { value: totalCost })
      ).to.be.revertedWithCustomError(personalizedMinter, "VoucherExpired");
    });

    it("Should track remaining allowance correctly", async function () {
      const quantity = 2;
      const discountedPrice = dropPrice.mul(8000).div(10000);
      const totalCost = discountedPrice.mul(quantity);

      // Check initial allowance
      let remaining = await personalizedMinter.getRemainingAllowance(fan1.address, 1, validVoucher);
      expect(remaining).to.equal(5);

      // Mint some tokens
      await personalizedMinter.connect(fan1).mintWithVoucher(validVoucher, quantity, { value: totalCost });

      // Check remaining allowance after mint (should be 0 due to nonce being used)
      remaining = await personalizedMinter.getRemainingAllowance(fan1.address, 1, validVoucher);
      expect(remaining).to.equal(0);
    });
  });

  describe("Administrative Functions", function () {
    it("Should update trusted signer", async function () {
      const newSigner = fan2.address;
      
      await expect(
        personalizedMinter.setTrustedSigner(newSigner)
      ).to.emit(personalizedMinter, "TrustedSignerUpdated")
        .withArgs(newSigner);

      expect(await personalizedMinter.trustedSigner()).to.equal(newSigner);
    });

    it("Should prevent non-owner from updating signer", async function () {
      await expect(
        personalizedMinter.connect(fan1).setTrustedSigner(fan1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Domain and Chain Info", function () {
    it("Should return correct domain separator", async function () {
      const domainSeparator = await personalizedMinter.getDomainSeparator();
      expect(domainSeparator).to.not.equal(ethers.constants.HashZero);
    });

    it("Should return correct chain ID", async function () {
      const chainId = await personalizedMinter.getChainId();
      expect(chainId).to.equal(31337); // Hardhat default chain ID
    });
  });
});