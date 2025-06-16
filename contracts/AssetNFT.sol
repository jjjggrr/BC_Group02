// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AssetNFT
 * @dev This is the core NFT contract representing a unique high-value asset.
 * The AssetRegistry contract is the owner and is the only one authorized to mint new assets.
 */
contract AssetNFT is ERC721, Ownable {
    constructor(address initialOwner) ERC721("National Asset Token", "NAT") Ownable(initialOwner) {}

    /**
     * @dev Mints a new asset NFT and assigns it to an owner.
     * Can only be called by the current owner of this contract (the AssetRegistry).
     */
    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }
}