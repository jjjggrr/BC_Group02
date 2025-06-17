# BC_Group02

## Overview
This project is a decentralized application (DApp) designed to track ownership, repairs, damages, and investments in high-value assets using smart contracts. It leverages blockchain technology to ensure transparency, security, and immutability of asset records.

## Features
- **NFT Management**: Represents unique high-value assets as NFTs, allowing for easy ownership transfer and verification.
- **Multi-Signature Transactions**: Enhances security by requiring multiple signatures for asset transactions, ensuring that no single party can unilaterally execute transactions.
- **Third-Party Verification**: Integrates a verification oracle to validate asset valuations and transaction legitimacy before allowing transactions to proceed.
- **Frontend for Asset Display and Valuation**: Provides a user-friendly interface to display assets, their valuations, and transaction history.

## Project Structure
```
my-asset-management-dapp
├── contracts
│   ├── AssetNFT.sol
│   ├── AssetRegistry.sol
│   ├── MultiSigWallet.sol
│   └── VerifierOracle.sol
├── frontend
│   ├── public
│   │   └── index.html
│   ├── src
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── scripts
│   └── deploy.js
├── test
│   └── assetManagement.test.js
├── hardhat.config.js
├── package.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd my-asset-management-dapp
   ```

2. Install dependencies:
   ```
   npm install
   Those 2 werent automatically installed for some reason:
   npm install @openzeppelin/contracts
   npm install --save-dev @nomicfoundation/hardhat-toolbox
   ```

3. Navigate to the frontend directory and install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

## Usage
- To deploy the smart contracts, run:
  ```
  npx hardhat run scripts/deploy.js --network <network-name>
  ```

- To start the frontend application, navigate to the `frontend` directory and run:
  ```
  npm start

  ```
## Node
Start the node
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

## Testing
Run the test suite to ensure all smart contracts function as expected (requires node to be deployed and hardhat to be started)
```
npx hardhat test
```

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.