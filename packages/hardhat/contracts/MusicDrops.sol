// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./PaymentSplitter.sol";

contract MusicDrops is ERC1155, ERC721, IERC2981, AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ARTIST_ROLE = keccak256("ARTIST_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    enum TokenType { ERC1155, ERC721 }
    enum DropStatus { NotStarted, Active, Ended, Paused }
    
    struct Drop {
        TokenType tokenType;
        uint256 tokenId;
        uint256 price;
        uint256 maxSupply;
        uint256 totalSupply;
        uint256 maxPerWallet;
        uint256 startTime;
        uint256 endTime;
        bytes32 merkleRoot;
        string metadataURI;
        address paymentSplitter;
        uint96 royaltyFeeBps;
        bool exists;
        bool metadataFrozen;
        bool dynamicMetadata;
    }
    
    struct Utility {
        string name;
        string description;
        bool active;
        uint256 tokenId;
        TokenType tokenType;
    }
    
    mapping(uint256 => Drop) public drops;
    mapping(uint256 => mapping(address => uint256)) public walletMints;
    mapping(uint256 => mapping(address => bool)) public utilityRedeemed;
    mapping(uint256 => Utility) public utilities;
    mapping(address => mapping(uint256 => bool)) public hasTokenAccess;
    
    uint256 public nextTokenId = 1;
    uint256 public nextUtilityId = 1;
    string public name = "MeTTa Music Drops";
    string public symbol = "MMD";
    string private _baseTokenURI;
    
    event DropCreated(
        uint256 indexed tokenId,
        TokenType tokenType,
        uint256 price,
        uint256 maxSupply,
        uint256 startTime,
        uint256 endTime,
        address indexed creator
    );
    
    event TokenMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 quantity,
        uint256 paid,
        TokenType tokenType
    );
    
    event UtilityCreated(uint256 indexed utilityId, uint256 indexed tokenId, string name);
    event UtilityRedeemed(uint256 indexed utilityId, uint256 indexed tokenId, address indexed user);
    event MetadataFrozen(uint256 indexed tokenId);
    event MetadataUpdated(uint256 indexed tokenId, string newURI);
    event BaseURIUpdated(string newBaseURI);
    
    error InvalidTokenType();
    error DropNotFound();
    error DropNotActive();
    error InsufficientPayment();
    error MaxSupplyExceeded();
    error MaxPerWalletExceeded();
    error InvalidMerkleProof();
    error MetadataFrozen();
    error UtilityNotFound();
    error UtilityAlreadyRedeemed();
    error NoTokenAccess();
    
    constructor(string memory baseURI) ERC1155(baseURI) ERC721(name, symbol) {
        _baseTokenURI = baseURI;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    function createDrop(
        TokenType tokenType,
        uint256 price,
        uint256 maxSupply,
        uint256 maxPerWallet,
        uint256 startTime,
        uint256 endTime,
        bytes32 merkleRoot,
        string memory metadataURI,
        address paymentSplitter,
        uint96 royaltyFeeBps
    ) external onlyRole(ARTIST_ROLE) returns (uint256) {
        uint256 tokenId = nextTokenId++;
        
        drops[tokenId] = Drop({
            tokenType: tokenType,
            tokenId: tokenId,
            price: price,
            maxSupply: maxSupply,
            totalSupply: 0,
            maxPerWallet: maxPerWallet,
            startTime: startTime,
            endTime: endTime,
            merkleRoot: merkleRoot,
            metadataURI: metadataURI,
            paymentSplitter: paymentSplitter,
            royaltyFeeBps: royaltyFeeBps,
            exists: true,
            metadataFrozen: false,
            dynamicMetadata: false
        });
        
        emit DropCreated(tokenId, tokenType, price, maxSupply, startTime, endTime, msg.sender);
        return tokenId;
    }
    
    function mintPublic(uint256 tokenId, uint256 quantity) external payable nonReentrant whenNotPaused {
        _mintToken(tokenId, quantity, new bytes32[](0));
    }
    
    function mintAllowlist(
        uint256 tokenId,
        uint256 quantity,
        bytes32[] calldata merkleProof
    ) external payable nonReentrant whenNotPaused {
        _mintToken(tokenId, quantity, merkleProof);
    }
    
    function _mintToken(uint256 tokenId, uint256 quantity, bytes32[] memory merkleProof) internal {
        Drop storage drop = drops[tokenId];
        if (!drop.exists) revert DropNotFound();
        
        DropStatus status = getDropStatus(tokenId);
        if (status != DropStatus.Active) revert DropNotActive();
        
        if (drop.totalSupply + quantity > drop.maxSupply) revert MaxSupplyExceeded();
        if (walletMints[tokenId][msg.sender] + quantity > drop.maxPerWallet) revert MaxPerWalletExceeded();
        
        if (drop.merkleRoot != bytes32(0)) {
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            if (!MerkleProof.verify(merkleProof, drop.merkleRoot, leaf)) revert InvalidMerkleProof();
        }
        
        uint256 totalCost = drop.price * quantity;
        if (msg.value < totalCost) revert InsufficientPayment();
        
        drop.totalSupply += quantity;
        walletMints[tokenId][msg.sender] += quantity;
        
        if (drop.tokenType == TokenType.ERC1155) {
            _mint(msg.sender, tokenId, quantity, "");
        } else {
            for (uint256 i = 0; i < quantity; i++) {
                _safeMint(msg.sender, tokenId);
            }
        }
        
        hasTokenAccess[msg.sender][tokenId] = true;
        
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        if (totalCost > 0 && drop.paymentSplitter != address(0)) {
            MeTTaPaymentSplitter(payable(drop.paymentSplitter)).deposit{value: totalCost}();
        }
        
        emit TokenMinted(tokenId, msg.sender, quantity, totalCost, drop.tokenType);
    }
    
    function createUtility(
        uint256 tokenId,
        string memory name_,
        string memory description
    ) external onlyRole(ARTIST_ROLE) returns (uint256) {
        if (!drops[tokenId].exists) revert DropNotFound();
        
        uint256 utilityId = nextUtilityId++;
        utilities[utilityId] = Utility({
            name: name_,
            description: description,
            active: true,
            tokenId: tokenId,
            tokenType: drops[tokenId].tokenType
        });
        
        emit UtilityCreated(utilityId, tokenId, name_);
        return utilityId;
    }
    
    function redeemUtility(uint256 utilityId) external nonReentrant {
        Utility storage utility = utilities[utilityId];
        if (!utility.active) revert UtilityNotFound();
        if (utilityRedeemed[utilityId][msg.sender]) revert UtilityAlreadyRedeemed();
        
        uint256 tokenId = utility.tokenId;
        bool hasAccess = false;
        
        if (utility.tokenType == TokenType.ERC1155) {
            hasAccess = balanceOf(msg.sender, tokenId) > 0;
        } else {
            hasAccess = ownerOf(tokenId) == msg.sender;
        }
        
        if (!hasAccess) revert NoTokenAccess();
        
        utilityRedeemed[utilityId][msg.sender] = true;
        emit UtilityRedeemed(utilityId, tokenId, msg.sender);
    }
    
    function updateMetadata(uint256 tokenId, string memory newURI) external onlyRole(ARTIST_ROLE) {
        Drop storage drop = drops[tokenId];
        if (!drop.exists) revert DropNotFound();
        if (drop.metadataFrozen) revert MetadataFrozen();
        
        drop.metadataURI = newURI;
        emit MetadataUpdated(tokenId, newURI);
    }
    
    function freezeMetadata(uint256 tokenId) external onlyRole(ARTIST_ROLE) {
        Drop storage drop = drops[tokenId];
        if (!drop.exists) revert DropNotFound();
        
        drop.metadataFrozen = true;
        emit MetadataFrozen(tokenId);
    }
    
    function setDynamicMetadata(uint256 tokenId, bool enabled) external onlyRole(ARTIST_ROLE) {
        Drop storage drop = drops[tokenId];
        if (!drop.exists) revert DropNotFound();
        
        drop.dynamicMetadata = enabled;
    }
    
    function setBaseURI(string memory newBaseURI) external onlyRole(ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }
    
    function getDropStatus(uint256 tokenId) public view returns (DropStatus) {
        Drop memory drop = drops[tokenId];
        if (!drop.exists) return DropStatus.NotStarted;
        if (paused()) return DropStatus.Paused;
        if (block.timestamp < drop.startTime) return DropStatus.NotStarted;
        if (block.timestamp > drop.endTime || drop.totalSupply >= drop.maxSupply) return DropStatus.Ended;
        return DropStatus.Active;
    }
    
    function uri(uint256 tokenId) public view override returns (string memory) {
        Drop memory drop = drops[tokenId];
        if (!drop.exists) return "";
        
        if (bytes(drop.metadataURI).length > 0) {
            return drop.metadataURI;
        }
        
        return string(abi.encodePacked(_baseTokenURI, Strings.toString(tokenId)));
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return uri(tokenId);
    }
    
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view override returns (address, uint256) {
        Drop memory drop = drops[tokenId];
        if (!drop.exists || drop.paymentSplitter == address(0)) {
            return (address(0), 0);
        }
        
        uint256 royaltyAmount = (salePrice * drop.royaltyFeeBps) / 10000;
        return (drop.paymentSplitter, royaltyAmount);
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, ERC721, IERC165, AccessControl) returns (bool) {
        return 
            interfaceId == type(IERC2981).interfaceId ||
            ERC1155.supportsInterface(interfaceId) ||
            ERC721.supportsInterface(interfaceId) ||
            AccessControl.supportsInterface(interfaceId);
    }
    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        
        for (uint256 i = 0; i < ids.length; i++) {
            if (to != address(0)) {
                hasTokenAccess[to][ids[i]] = true;
            }
        }
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        if (to != address(0)) {
            hasTokenAccess[to][tokenId] = true;
        }
    }
}