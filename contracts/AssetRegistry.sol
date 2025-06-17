// filepath: /my-asset-management-dapp/my-asset-management-dapp/contracts/AssetRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AssetNFT.sol";
import "./MultiSigWallet.sol";
import "./VerifierOracle.sol";

/**
 * @title AssetRegistry
 * @dev Manages the creation and lifecycle of assets represented by NFTs.
 */
contract AssetRegistry is AccessControl {
    // Role definitions
    bytes32 public constant CERTIFIED_PROFESSIONAL_ROLE = keccak256("CERTIFIED_PROFESSIONAL_ROLE");
    bytes32 public constant BANK_ROLE = keccak256("BANK_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // The linked NFT contract
    AssetNFT public assetNft;
    MultiSigWallet public multiSigWallet;
    VerifierOracle public verifierOracle;

    // Struct to hold details about a lifecycle event
    struct LifecycleEvent {
        uint256 timestamp;
        string eventType; // e.g., "Repair", "Modification", "Damage Report"
        string description;
        address recordedBy; // The certified professional who recorded the event
    }

    // Struct to hold all data for a specific asset
    struct AssetData {
        string assetDetails; // e.g., JSON string with property address, VIN, etc.
        LifecycleEvent[] lifecycleHistory;
    }

    // Mapping from tokenId to its asset data
    mapping(uint256 => AssetData) public assetDataStore;

    // Counter for issuing new tokenIds
    uint256 private _nextTokenId;

    event AssetRegistered(uint256 indexed tokenId, address indexed owner, string assetDetails);
    event LifecycleEventAdded(uint256 indexed tokenId, string eventType, string description, address indexed recordedBy);

    constructor(address multiSigWalletAddress, address verifierOracleAddress) {
        // Grant the contract deployer the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        // Deploy the NFT contract and transfer its ownership to this registry contract
        assetNft = new AssetNFT(address(this));
        multiSigWallet = MultiSigWallet(multiSigWalletAddress);
        verifierOracle = VerifierOracle(verifierOracleAddress);
    }

    /**
     * @dev Registers a new asset in the system.
     * Mints a corresponding NFT and assigns it to the owner.
     * Only callable by users with the ADMIN_ROLE.
     */
    function registerNewAsset(address owner, string calldata assetDetails) public onlyRole(ADMIN_ROLE) {
        uint256 tokenId = _nextTokenId++;
        assetNft.safeMint(owner, tokenId);
        assetDataStore[tokenId].assetDetails = assetDetails;

        emit AssetRegistered(tokenId, owner, assetDetails);
    }

    /**
     * @dev Adds a new lifecycle event to an asset's history.
     * Only callable by authorized certified professionals.
     * The professional digitally "signs" the record with their address.
     */
    function addLifecycleEvent(uint256 tokenId, string calldata eventType, string calldata description) public onlyRole(CERTIFIED_PROFESSIONAL_ROLE) {
        require(assetNft.ownerOf(tokenId) != address(0), "Asset does not exist.");
        
        assetDataStore[tokenId].lifecycleHistory.push(LifecycleEvent({
            timestamp: block.timestamp,
            eventType: eventType,
            description: description,
            recordedBy: msg.sender
        }));

        emit LifecycleEventAdded(tokenId, eventType, description, msg.sender);
    }

    // --- Role Management Functions ---

    function grantCertifiedProfessionalRole(address user) public onlyRole(ADMIN_ROLE) {
        grantRole(CERTIFIED_PROFESSIONAL_ROLE, user);
    }

    function grantBankRole(address user) public onlyRole(ADMIN_ROLE) {
        grantRole(BANK_ROLE, user);
    }
}