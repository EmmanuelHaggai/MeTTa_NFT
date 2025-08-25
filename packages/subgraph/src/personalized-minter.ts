import { Address, BigInt } from "@graphprotocol/graph-ts";
import { PersonalizedMint as PersonalizedMintEvent } from "../../hardhat/typechain-types/PersonalizedMinter";
import { PersonalizedMint, User } from "../generated/schema";

export function handlePersonalizedMint(event: PersonalizedMintEvent): void {
  let mintId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let mint = new PersonalizedMint(mintId);
  let minter = getOrCreateUser(event.params.wallet);

  mint.collection = event.params.collection;
  mint.tokenId = event.params.tokenId;
  mint.minter = minter.id;
  mint.quantity = event.params.quantity;
  mint.finalPrice = event.params.finalPrice;
  mint.nonce = event.params.nonce;
  mint.timestamp = event.block.timestamp;
  mint.transactionHash = event.transaction.hash;
  mint.blockNumber = event.block.number;

  mint.save();

  // Update user stats
  minter.totalMints = minter.totalMints.plus(event.params.quantity);
  minter.totalSpent = minter.totalSpent.plus(event.params.finalPrice.times(event.params.quantity));
  minter.lastMintAt = event.block.timestamp;
  
  // Update fan level based on activity
  updateFanLevel(minter);
  minter.save();
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

function updateFanLevel(user: User): void {
  let totalMints = user.totalMints.toI32();
  let totalSpentEth = user.totalSpent.div(BigInt.fromI32(10).pow(18)).toI32();

  if (totalMints >= 20 || totalSpentEth >= 1) {
    user.fanLevel = "VIP";
  } else if (totalMints >= 10 || totalSpentEth >= 5) {
    user.fanLevel = "Premium";
  } else {
    user.fanLevel = "Standard";
  }
}