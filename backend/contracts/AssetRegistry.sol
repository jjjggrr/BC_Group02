// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AssetNFT.sol";
import "./MultiSigWallet.sol";
import "./VerifierOracle.sol";

/**
 * @title AssetRegistry
 * @dev Manages the creation and lifecycle of assets represented by NFTs. Also stores the current estimated value
 */
contract AssetRegistry is AccessControl {
    // Role definitions
    bytes32 public constant CERTIFIED_PROFESSIONAL_ROLE = keccak256("CERTIFIED_PROFESSIONAL_ROLE");
    bytes32 public constant BANK_ROLE = keccak256("BANK_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // The linked NFT contract
    AssetNFT public assetNft;
    MultiSigWallet public standardMultiSigWallet;
    MultiSigWallet public bankMultiSigWallet;
    VerifierOracle public verifierOracle;
    uint256 public highValueThreshold;

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
        uint256 value;       // Monetary value of the asset
        address owner;
        LifecycleEvent[] lifecycleHistory;
        bool exists;
    }

    // Mapping from tokenId to its asset data
    mapping(uint256 => AssetData) public assetDataStore;

    // Counter for issuing new tokenIds
    uint256 private _nextTokenId;

    event AssetRegistered(uint256 indexed tokenId, address indexed owner, string assetDetails, uint256 value);
    event LifecycleEventAdded(uint256 indexed tokenId, string eventType, string description, address indexed recordedBy);
    event TransferInitiated(uint256 indexed tokenId, address indexed from, address indexed to, address multiSigWalletUsed, uint256 multiSigTxId);
    event AssetValueUpdated(uint256 indexed tokenId, uint256 newValue, address indexed updatedBy); // New Event

    constructor(
        address _standardMultiSigWalletAddress,
        address _bankMultiSigWalletAddress,
        address _verifierOracleAddress,
        uint256 _highValueThreshold
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        assetNft = new AssetNFT(address(this));
        standardMultiSigWallet = MultiSigWallet(_standardMultiSigWalletAddress);
        bankMultiSigWallet = MultiSigWallet(_bankMultiSigWalletAddress);
        verifierOracle = VerifierOracle(_verifierOracleAddress);
        highValueThreshold = _highValueThreshold;
    }

    function registerNewAsset(address owner, string calldata assetDetails, uint256 value) public onlyRole(ADMIN_ROLE) {
    uint256 tokenId = _nextTokenId++;
    assetNft.safeMint(owner, tokenId);
    
    // Create the AssetData struct without the lifecycleHistory array first
    AssetData storage newAsset = assetDataStore[tokenId];
    newAsset.assetDetails = assetDetails;
    newAsset.value = value;
    newAsset.owner = owner;
    newAsset.exists = true;
    // lifecycleHistory is automatically initialized as an empty array
    
    emit AssetRegistered(tokenId, owner, assetDetails, value);
}

    function addLifecycleEvent(uint256 tokenId, string calldata eventType, string calldata description) public onlyRole(CERTIFIED_PROFESSIONAL_ROLE) {
    require(assetDataStore[tokenId].exists, "Asset does not exist."); // Use the exists field
    
    assetDataStore[tokenId].lifecycleHistory.push(LifecycleEvent({
        timestamp: block.timestamp,
        eventType: eventType,
        description: description,
        recordedBy: msg.sender
    }));

    emit LifecycleEventAdded(tokenId, eventType, description, msg.sender);
}

    /**
     * @dev Updates the estimated value of a registered asset.
     * Can only be called by a user with the CERTIFIED_PROFESSIONAL_ROLE.
     * This is used to reflect changes in value due to damage, repairs, or market shifts.
     */
    function updateAssetValue(uint256 tokenId, uint256 newValue) public onlyRole(CERTIFIED_PROFESSIONAL_ROLE) {
    require(assetDataStore[tokenId].exists, "Asset does not exist."); // Use the exists field
    
    assetDataStore[tokenId].value = newValue;
    emit AssetValueUpdated(tokenId, newValue, msg.sender);
}
    
    /**
     * @dev Initiates a transfer request for an asset through the appropriate MultiSigWallet.
     * The caller (owner of the NFT) must first approve the chosen MultiSigWallet
     * to transfer this specific token on the AssetNFT contract.
     */
    function initiateTransfer(uint256 tokenId, address to) external {
        address currentOwner = assetNft.ownerOf(tokenId);
        require(currentOwner == msg.sender, "AssetRegistry: Caller is not the owner of the token.");
        require(to != address(0), "AssetRegistry: Transfer to the zero address is not allowed.");
        require(assetDataStore[tokenId].exists, "Asset not registered in AssetRegistry."); // Use the exists field


        MultiSigWallet targetMultiSig;
        if (assetDataStore[tokenId].value > highValueThreshold) {
            targetMultiSig = bankMultiSigWallet;
        } else {
            targetMultiSig = standardMultiSigWallet;
        }

        // IMPORTANT: The owner (msg.sender) must have ALREADY CALLED:
        // assetNft.approve(address(targetMultiSig), tokenId)
        require(assetNft.getApproved(tokenId) == address(targetMultiSig), "AssetRegistry: Chosen MultiSigWallet not approved for this token.");

    bytes memory callData = abi.encodeWithSelector(
    bytes4(keccak256("safeTransferFrom(address,address,uint256)")),
    currentOwner,
    to,
    tokenId
);

        // The MultiSigWallet's createTransaction function should be callable by anyone authorized (e.g., onlySigner)
        // Here, we assume the currentOwner (msg.sender) is a signer on the targetMultiSig or can create tx.
        // If not, this model needs adjustment (e.g. AssetRegistry creates it via an internal trusted call).
        // For now, let's assume the MultiSigWallet allows any of its signers to create a transaction.
        // The owner (msg.sender) should be a signer on the MultiSigWallet they intend to use.
        uint256 multiSigTxId = targetMultiSig.transactionCount(); // Get next txId
        targetMultiSig.createTransaction(
            address(assetNft), // Target contract to call
            0,                 // ETH value
            callData           // Encoded function call
        );

        emit TransferInitiated(tokenId, currentOwner, to, address(targetMultiSig), multiSigTxId);
    }

    // --- Role Management Functions ---

    function grantCertifiedProfessionalRole(address user) public onlyRole(ADMIN_ROLE) {
        grantRole(CERTIFIED_PROFESSIONAL_ROLE, user);
    }

    function grantBankRole(address user) public onlyRole(ADMIN_ROLE) {
        grantRole(BANK_ROLE, user);
    }
}