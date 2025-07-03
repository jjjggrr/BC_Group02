// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

/**
 * @title AssetNFT
 * @dev This contract represents a unique high-value asset as an NFT.
 * It includes functions for minting NFTs and managing ownership.
 */
contract AssetNFT is ERC721Enumerable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Constructor takes the AssetRegistry address
    constructor(address assetRegistry) ERC721("HighValueAsset", "HVA") {
        _grantRole(DEFAULT_ADMIN_ROLE, assetRegistry);
        _grantRole(MINTER_ROLE, assetRegistry);
    }

    /**
     * @dev Mints a new asset NFT and assigns it to an owner.
     * Can only be called by addresses with MINTER_ROLE (AssetRegistry).
     * The tokenId is passed as an argument.
     */
    function safeMint(
        address to,
        uint256 tokenId
    ) public onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
    }

    // Required override for ERC721Enumerable
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
