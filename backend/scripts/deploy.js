const hre = require("hardhat");

async function main() {
    const [deployer, anotherSigner, bankSigner] = await hre.ethers.getSigners(); // Get more signers
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Another signer for Standard MultiSig:", anotherSigner.address);
    console.log("Bank signer for Bank MultiSig:", bankSigner.address);

    // 1a. Deploy Standard MultiSigWallet
    const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
    const standardSigners = [deployer.address, anotherSigner.address]; 
    const standardRequiredConfirmations = 2; // Example: 2 of 2
    const standardMultiSigWallet = await MultiSigWallet.deploy(standardSigners, standardRequiredConfirmations);
    await standardMultiSigWallet.waitForDeployment(); 
    console.log("Standard MultiSigWallet deployed to:", await standardMultiSigWallet.getAddress());

    // 1b. Deploy Bank/High-Value MultiSigWallet
    const bankSigners = [deployer.address, anotherSigner.address, bankSigner.address];
    const bankRequiredConfirmations = 3; // Example: 3 of 3 (owner, other party, bank)
    const bankMultiSigWallet = await MultiSigWallet.deploy(bankSigners, bankRequiredConfirmations);
    await bankMultiSigWallet.waitForDeployment();
    console.log("Bank MultiSigWallet deployed to:", await bankMultiSigWallet.getAddress());

    // 2. Deploy VerifierOracle
    const VerifierOracle = await hre.ethers.getContractFactory("VerifierOracle");
    const verifierOracle = await VerifierOracle.deploy(); 
    await verifierOracle.waitForDeployment();
    console.log("VerifierOracle deployed to:", await verifierOracle.getAddress());

    // 3. Define High-Value Threshold (e.g., 100000 units of currency/value)
    const highValueThreshold = hre.ethers.parseUnits("100000", "ether"); // Example: 100,000 ETH as high value, adjust as needed

    // 4. Deploy AssetRegistry
    const AssetRegistry = await hre.ethers.getContractFactory("AssetRegistry");
    const assetRegistry = await AssetRegistry.deploy(
        await standardMultiSigWallet.getAddress(),
        await bankMultiSigWallet.getAddress(),
        await verifierOracle.getAddress(),
        highValueThreshold
    );
    await assetRegistry.waitForDeployment();
    console.log("AssetRegistry deployed to:", await assetRegistry.getAddress());
    console.log("AssetRegistry highValueThreshold set to:", (await assetRegistry.highValueThreshold()).toString());


    // 5. Get the address of AssetNFT
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