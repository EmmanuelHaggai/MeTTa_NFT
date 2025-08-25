import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  DropCreated,
  TokenMinted,
  UtilityCreated,
  UtilityRedeemed,
  MetadataUpdated,
  MetadataFrozen,
} from "../../hardhat/typechain-types/MusicDrops";

import {
  Drop,
  Token,
  User,
  Mint,
  Utility,
  UtilityRedemption,
  TokenHolder,
  DailyStats,
  GlobalStats,
} from "../generated/schema";

export function handleDropCreated(event: DropCreated): void {
  let drop = new Drop(event.params.tokenId.toString());
  let creator = getOrCreateUser(event.params.creator);

  drop.tokenId = event.params.tokenId;
  drop.tokenType = event.params.tokenType == 0 ? "ERC1155" : "ERC721";
  drop.price = event.params.price;
  drop.maxSupply = event.params.maxSupply;
  drop.totalSupply = BigInt.fromI32(0);
  drop.maxPerWallet = BigInt.fromI32(0); // Will need to get from contract
  drop.startTime = event.params.startTime;
  drop.endTime = event.params.endTime;
  drop.metadataURI = "";
  drop.creator = creator.id;
  drop.createdAt = event.block.timestamp;
  drop.updatedAt = event.block.timestamp;
  drop.metadataFrozen = false;

  drop.save();

  // Create token entity
  let token = new Token(event.params.tokenId.toString());
  token.tokenId = event.params.tokenId;
  token.tokenType = event.params.tokenType == 0 ? "ERC1155" : "ERC721";
  token.drop = drop.id;
  token.currentSupply = BigInt.fromI32(0);
  token.save();

  // Update global stats
  updateGlobalStats(event.block.timestamp);
}

export function handleTokenMinted(event: TokenMinted): void {
  let mintId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let mint = new Mint(mintId);
  let minter = getOrCreateUser(event.params.to);
  let drop = Drop.load(event.params.tokenId.toString());
  let token = Token.load(event.params.tokenId.toString());

  if (!drop || !token) {
    return;
  }

  mint.drop = drop.id;
  mint.token = token.id;
  mint.minter = minter.id;
  mint.quantity = event.params.quantity;
  mint.paid = event.params.paid;
  mint.timestamp = event.block.timestamp;
  mint.transactionHash = event.transaction.hash;
  mint.blockNumber = event.block.number;

  mint.save();

  // Update drop total supply
  drop.totalSupply = drop.totalSupply.plus(event.params.quantity);
  drop.updatedAt = event.block.timestamp;
  drop.save();

  // Update token supply
  token.currentSupply = token.currentSupply.plus(event.params.quantity);
  token.save();

  // Update user stats
  minter.totalMints = minter.totalMints.plus(event.params.quantity);
  minter.totalSpent = minter.totalSpent.plus(event.params.paid);
  minter.lastMintAt = event.block.timestamp;
  if (minter.firstMintAt == BigInt.fromI32(0)) {
    minter.firstMintAt = event.block.timestamp;
  }
  minter.save();

  // Update or create token holder
  let holderId = event.params.tokenId.toString() + "-" + event.params.to.toHexString();
  let holder = TokenHolder.load(holderId);
  if (!holder) {
    holder = new TokenHolder(holderId);
    holder.token = token.id;
    holder.holder = minter.id;
    holder.balance = BigInt.fromI32(0);
    holder.firstMintAt = event.block.timestamp;
  }
  holder.balance = holder.balance.plus(event.params.quantity);
  holder.lastMintAt = event.block.timestamp;
  holder.save();

  // Update daily stats
  updateDailyStats(event.block.timestamp, event.params.paid, minter.id);
  updateGlobalStats(event.block.timestamp);
}

export function handleUtilityCreated(event: UtilityCreated): void {
  let utility = new Utility(event.params.utilityId.toString());
  let drop = Drop.load(event.params.tokenId.toString());

  if (!drop) {
    return;
  }

  utility.utilityId = event.params.utilityId;
  utility.drop = drop.id;
  utility.name = event.params.name;
  utility.description = ""; // Will need to get from contract if available
  utility.active = true;
  utility.createdAt = event.block.timestamp;

  utility.save();
  updateGlobalStats(event.block.timestamp);
}

export function handleUtilityRedeemed(event: UtilityRedeemed): void {
  let redemptionId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let redemption = new UtilityRedemption(redemptionId);
  let utility = Utility.load(event.params.utilityId.toString());
  let user = getOrCreateUser(event.params.user);

  if (!utility) {
    return;
  }

  redemption.utility = utility.id;
  redemption.user = user.id;
  redemption.timestamp = event.block.timestamp;
  redemption.transactionHash = event.transaction.hash;
  redemption.blockNumber = event.block.number;

  redemption.save();
  updateGlobalStats(event.block.timestamp);
}

export function handleMetadataUpdated(event: MetadataUpdated): void {
  let drop = Drop.load(event.params.tokenId.toString());
  if (!drop) {
    return;
  }

  drop.metadataURI = event.params.newURI;
  drop.updatedAt = event.block.timestamp;
  drop.save();
}

export function handleMetadataFrozen(event: MetadataFrozen): void {
  let drop = Drop.load(event.params.tokenId.toString());
  if (!drop) {
    return;
  }

  drop.metadataFrozen = true;
  drop.updatedAt = event.block.timestamp;
  drop.save();
}

function getOrCreateUser(address: Address): User {
  let userId = address.toHexString();
  let user = User.load(userId);

  if (!user) {
    user = new User(userId);
    user.address = address;
    user.totalMints = BigInt.fromI32(0);
    user.totalSpent = BigInt.fromI32(0);
    user.firstMintAt = BigInt.fromI32(0);
    user.lastMintAt = BigInt.fromI32(0);
    user.fanLevel = "Standard";
    user.save();
  }

  return user;
}

function updateDailyStats(timestamp: BigInt, volume: BigInt, userId: string): void {
  let dayId = timestamp.toI32() / 86400;
  let dailyStats = DailyStats.load(dayId.toString());

  if (!dailyStats) {
    dailyStats = new DailyStats(dayId.toString());
    dailyStats.date = new Date(dayId * 86400 * 1000).toISOString().split("T")[0];
    dailyStats.totalMints = BigInt.fromI32(0);
    dailyStats.totalVolume = BigInt.fromI32(0);
    dailyStats.uniqueMinters = BigInt.fromI32(0);
    dailyStats.newUsers = BigInt.fromI32(0);
  }

  dailyStats.totalMints = dailyStats.totalMints.plus(BigInt.fromI32(1));
  dailyStats.totalVolume = dailyStats.totalVolume.plus(volume);

  // Check if user is new (simplified - could be improved)
  let user = User.load(userId);
  if (user && user.firstMintAt == timestamp) {
    dailyStats.newUsers = dailyStats.newUsers.plus(BigInt.fromI32(1));
  }

  dailyStats.save();
}

function updateGlobalStats(timestamp: BigInt): void {
  let globalStats = GlobalStats.load("global");

  if (!globalStats) {
    globalStats = new GlobalStats("global");
    globalStats.totalDrops = BigInt.fromI32(0);
    globalStats.totalMints = BigInt.fromI32(0);
    globalStats.totalVolume = BigInt.fromI32(0);
    globalStats.totalUsers = BigInt.fromI32(0);
    globalStats.totalUtilities = BigInt.fromI32(0);
    globalStats.totalRedemptions = BigInt.fromI32(0);
  }

  globalStats.updatedAt = timestamp;
  globalStats.save();
}