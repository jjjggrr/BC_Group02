// filepath: /my-asset-management-dapp/my-asset-management-dapp/scripts/deploy.js
const hre = require("hardhat");

async function main() {
    const AssetNFT = await hre.ethers.getContractFactory("AssetNFT");
    const assetNFT = await AssetNFT.deploy("AssetNFT", "ANFT");
    await assetNFT.deployed();
    console.log("AssetNFT deployed to:", assetNFT.address);

    const AssetRegistry = await hre.ethers.getContractFactory("AssetRegistry");
    const assetRegistry = await AssetRegistry.deploy(assetNFT.address);
    await assetRegistry.deployed();
    console.log("AssetRegistry deployed to:", assetRegistry.address);

    const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
    const multiSigWallet = await MultiSigWallet.deploy([/* Add initial owners' addresses here */], 2); // 2 is the required number of confirmations
    await multiSigWallet.deployed();
    console.log("MultiSigWallet deployed to:", multiSigWallet.address);

    const VerifierOracle = await hre.ethers.getContractFactory("VerifierOracle");
    const verifierOracle = await VerifierOracle.deploy();
    await verifierOracle.deployed();
    console.log("VerifierOracle deployed to:", verifierOracle.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });