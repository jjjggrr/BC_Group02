// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AssetContract {
    struct Asset {
        uint id;
        string name;
        address owner;
    }

    mapping(uint => Asset) public assets;
    uint public assetCount;

    event AssetCreated(uint id, string name, address owner);
    event AssetTransferred(uint id, address from, address to);

    function createAsset(string memory _name) public {
        assetCount++;
        assets[assetCount] = Asset(assetCount, _name, msg.sender);
        emit AssetCreated(assetCount, _name, msg.sender);
    }

    function transferAsset(uint _id, address _to) public {
        require(assets[_id].owner == msg.sender, "You are not the owner");
        assets[_id].owner = _to;
        emit AssetTransferred(_id, msg.sender, _to);
    }
}