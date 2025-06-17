// filepath: /my-asset-management-dapp/my-asset-management-dapp/contracts/AssetNFT.sol
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
    uint256 private _nextTokenId;

    constructor() ERC721("HighValueAsset", "HVA") {}

    /**
     * @dev Mints a new asset NFT and assigns it to an owner.
     * Can only be called by the current owner of this contract.
     */
    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    /**
     * @dev Returns the next token ID to be minted.
     */
    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }
}