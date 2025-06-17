// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AssetNFT
 * @dev This contract represents a unique high-value asset as an NFT.
 * It includes functions for minting NFTs and managing ownership.
 */
contract AssetNFT is ERC721, Ownable {

    // Constructor now correctly takes initialOwner and passes it to Ownable
    constructor(address initialOwner) ERC721("HighValueAsset", "HVA") Ownable(initialOwner) {
    }

    /**
     * @dev Mints a new asset NFT and assigns it to an owner.
     * Can only be called by the current owner of this contract (which will be AssetRegistry).
     * The tokenId is passed as an argument.
     */
    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }
}