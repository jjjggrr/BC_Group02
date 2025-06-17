const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy MultiSigWallet
    const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
    // Replace with actual signer addresses and desired confirmation count
    // For local testing, using the deployer as one of the signers is common.
    const initialSigners = [deployer.address]; 
    const requiredConfirmations = 1; 
    const multiSigWallet = await MultiSigWallet.deploy(initialSigners, requiredConfirmations);
    // await multiSigWallet.deployed(); // .deployed() is deprecated, wait for the transaction to be mined
    await multiSigWallet.waitForDeployment(); 
    console.log("MultiSigWallet deployed to:", await multiSigWallet.getAddress());

    // 2. Deploy VerifierOracle
    const VerifierOracle = await hre.ethers.getContractFactory("VerifierOracle");
    // VerifierOracle's Ownable constructor takes msg.sender (the deployer) by default if not overridden
    // If VerifierOracle's constructor is just `constructor() Ownable(msg.sender) {}`, no args are needed here.
    // If it explicitly takes an initialOwner: `constructor(address initialOwner) Ownable(initialOwner) {}`
    // then you'd pass `deployer.address` or similar. Assuming it's like AssetNFT and takes initialOwner:
    const verifierOracle = await VerifierOracle.deploy(); // Pass deployer as initial owner
    // await verifierOracle.deployed();
    await verifierOracle.waitForDeployment();
    console.log("VerifierOracle deployed to:", await verifierOracle.getAddress());

    // 3. Deploy AssetRegistry, passing the addresses of MultiSigWallet and VerifierOracle
    const AssetRegistry = await hre.ethers.getContractFactory("AssetRegistry");
    const assetRegistry = await AssetRegistry.deploy(await multiSigWallet.getAddress(), await verifierOracle.getAddress());
    // await assetRegistry.deployed();
    await assetRegistry.waitForDeployment();
    console.log("AssetRegistry deployed to:", await assetRegistry.getAddress());

    // 4. Get the address of AssetNFT (which was deployed by AssetRegistry's constructor)
    const assetNftAddress = await assetRegistry.assetNft();
    console.log("AssetNFT (deployed by AssetRegistry) is at:", assetNftAddress);

    console.log("Deployment complete.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });