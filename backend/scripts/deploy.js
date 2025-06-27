const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    
    // Use deployer for all signers since you only have one private key
    const anotherSigner = deployer;
    const bankSigner = deployer;
    
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Another signer for Standard MultiSig:", anotherSigner.address);
    console.log("Bank signer for Bank MultiSig:", bankSigner.address);


        // 1a. Deploy Standard MultiSigWallet
    const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
    const standardSigners = [deployer.address]; // Only one signer for now
    const standardRequiredConfirmations = 1; // 1 of 1 for testing
    const standardMultiSigWallet = await MultiSigWallet.deploy(standardSigners, standardRequiredConfirmations);
    await standardMultiSigWallet.waitForDeployment(); 
    console.log("Standard MultiSigWallet deployed to:", await standardMultiSigWallet.getAddress());
    
    // 1b. Deploy Bank/High-Value MultiSigWallet
    const bankSigners = [deployer.address]; // Only one signer for now
    const bankRequiredConfirmations = 1; // 1 of 1 for testing
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

    // Save contract addresses for frontend
    const contractsData = {
        AssetRegistry: {
            address: await assetRegistry.getAddress(),
            abi: AssetRegistry.interface.format('json')
        },
        AssetNFT: {
            address: assetNftAddress,
            abi: (await hre.ethers.getContractFactory("AssetNFT")).interface.format('json')
        },
        StandardMultiSigWallet: {
            address: await standardMultiSigWallet.getAddress()
        },
        BankMultiSigWallet: {
            address: await bankMultiSigWallet.getAddress()
        }
    };

    // Write to frontend directory
    const frontendDir = path.join(__dirname, '..', '..', 'frontend', 'src');
    fs.writeFileSync(
        path.join(frontendDir, 'contracts.json'),
        JSON.stringify(contractsData, null, 2)
    );

    console.log("Contract data saved to frontend/src/contracts.json");
    console.log("Deployment complete.");

    // At the end, you'll see output like:
    console.log("=== DEPLOYMENT ADDRESSES ===");
    console.log("AssetRegistry deployed to:", await assetRegistry.getAddress());
    console.log("AssetNFT deployed at:", assetNftAddress);
    console.log("Standard MultiSig:", await standardMultiSigWallet.getAddress());
    console.log("Bank MultiSig:", await bankMultiSigWallet.getAddress());
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });