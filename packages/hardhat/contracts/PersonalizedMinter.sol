// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "./MusicDrops.sol";

contract PersonalizedMinter is EIP712, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    
    struct MintVoucher {
        address collection;
        uint256 tokenId;
        address wallet;
        uint256 price;
        uint256 discountBps;
        uint256 maxQuantity;
        uint256 startTime;
        uint256 endTime;
        uint256 nonce;
        bytes signature;
    }
    
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) public nonceUsed;
    mapping(address => mapping(uint256 => uint256)) public personalizedMints;
    
    address public trustedSigner;
    string private constant SIGNING_DOMAIN = "MeTTaPersonalizedMinter";
    string private constant SIGNATURE_VERSION = "1";
    
    event PersonalizedMint(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed wallet,
        uint256 quantity,
        uint256 finalPrice,
        uint256 nonce
    );
    
    event TrustedSignerUpdated(address indexed newSigner);
    
    error InvalidSignature();
    error VoucherExpired();
    error VoucherNotStarted();
    error NonceAlreadyUsed();
    error ExceedsMaxQuantity();
    error InsufficientPayment();
    error InvalidCollection();
    
    constructor(address _trustedSigner) EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {
        trustedSigner = _trustedSigner;
    }
    
    function mintWithVoucher(MintVoucher calldata voucher, uint256 quantity) external payable nonReentrant {
        if (!_verifyVoucher(voucher)) revert InvalidSignature();
        if (block.timestamp < voucher.startTime) revert VoucherNotStarted();
        if (block.timestamp > voucher.endTime) revert VoucherExpired();
        if (nonceUsed[voucher.wallet][voucher.tokenId][voucher.nonce]) revert NonceAlreadyUsed();
        if (personalizedMints[voucher.wallet][voucher.tokenId] + quantity > voucher.maxQuantity) revert ExceedsMaxQuantity();
        
        uint256 discountAmount = (voucher.price * voucher.discountBps) / 10000;
        uint256 finalPrice = voucher.price - discountAmount;
        uint256 totalCost = finalPrice * quantity;
        
        if (msg.value < totalCost) revert InsufficientPayment();
        
        nonceUsed[voucher.wallet][voucher.tokenId][voucher.nonce] = true;
        personalizedMints[voucher.wallet][voucher.tokenId] += quantity;
        
        MusicDrops collection = MusicDrops(voucher.collection);
        
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        try collection.mintPublic{value: totalCost}(voucher.tokenId, quantity) {
            
        } catch {
            revert InvalidCollection();
        }
        
        emit PersonalizedMint(
            voucher.collection,
            voucher.tokenId,
            voucher.wallet,
            quantity,
            finalPrice,
            voucher.nonce
        );
    }
    
    function getRemainingAllowance(address wallet, uint256 tokenId, MintVoucher calldata voucher) external view returns (uint256) {
        if (!_verifyVoucher(voucher) || voucher.wallet != wallet || voucher.tokenId != tokenId) {
            return 0;
        }
        
        if (block.timestamp < voucher.startTime || block.timestamp > voucher.endTime) {
            return 0;
        }
        
        if (nonceUsed[wallet][tokenId][voucher.nonce]) {
            return 0;
        }
        
        uint256 minted = personalizedMints[wallet][tokenId];
        if (minted >= voucher.maxQuantity) {
            return 0;
        }
        
        return voucher.maxQuantity - minted;
    }
    
    function _verifyVoucher(MintVoucher calldata voucher) internal view returns (bool) {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            keccak256("MintVoucher(address collection,uint256 tokenId,address wallet,uint256 price,uint256 discountBps,uint256 maxQuantity,uint256 startTime,uint256 endTime,uint256 nonce)"),
            voucher.collection,
            voucher.tokenId,
            voucher.wallet,
            voucher.price,
            voucher.discountBps,
            voucher.maxQuantity,
            voucher.startTime,
            voucher.endTime,
            voucher.nonce
        )));
        
        address signer = digest.recover(voucher.signature);
        return signer == trustedSigner;
    }
    
    function setTrustedSigner(address _newSigner) external onlyOwner {
        trustedSigner = _newSigner;
        emit TrustedSignerUpdated(_newSigner);
    }
    
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
    
    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
}