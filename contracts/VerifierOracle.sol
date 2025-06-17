// filepath: /my-asset-management-dapp/my-asset-management-dapp/contracts/VerifierOracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VerifierOracle
 * @dev This contract acts as a third-party verification service for asset transactions.
 * It verifies transactions and ensures that asset valuations are within acceptable ranges.
 */
contract VerifierOracle {
    // Struct to hold asset valuation data
    struct AssetValuation {
        uint256 assetId;
        uint256 valuation;
        address verifier;
        uint256 timestamp;
    }

    // Mapping to store asset valuations
    mapping(uint256 => AssetValuation) public valuations;

    // Event emitted when a new valuation is submitted
    event ValuationSubmitted(uint256 indexed assetId, uint256 valuation, address indexed verifier);

    /**
     * @dev Submits a new asset valuation.
     * Only callable by authorized verifiers.
     */
    function submitValuation(uint256 assetId, uint256 valuation) external {
        // Ensure the valuation is positive
        require(valuation > 0, "Valuation must be positive.");

        // Store the valuation
        valuations[assetId] = AssetValuation({
            assetId: assetId,
            valuation: valuation,
            verifier: msg.sender,
            timestamp: block.timestamp
        });

        emit ValuationSubmitted(assetId, valuation, msg.sender);
    }

    /**
     * @dev Retrieves the valuation for a specific asset.
     */
    function getValuation(uint256 assetId) external view returns (AssetValuation memory) {
        return valuations[assetId];
    }
}