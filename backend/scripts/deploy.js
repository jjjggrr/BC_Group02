const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy MultiSigWallets first (with only deployer as signer initially)
    const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");

    const standardSigners = [deployer.address]; // Only deployer initially
    const standardRequiredConfirmations = 1;
    const standardMultiSigWallet = await MultiSigWallet.deploy(standardSigners, standardRequiredConfirmations);
    await standardMultiSigWallet.waitForDeployment();
    console.log("Standard MultiSigWallet deployed to:", await standardMultiSigWallet.getAddress());
    
    const bankSigners = [deployer.address]; // Only deployer initially  
    const bankRequiredConfirmations = 1;
    const bankMultiSigWallet = await MultiSigWallet.deploy(bankSigners, bankRequiredConfirmations);
    await bankMultiSigWallet.waitForDeployment();
    console.log("Bank MultiSigWallet deployed to:", await bankMultiSigWallet.getAddress());

    // 2. Deploy VerifierOracle
    const VerifierOracle = await hre.ethers.getContractFactory("VerifierOracle");
    const verifierOracle = await VerifierOracle.deploy(); 
    await verifierOracle.waitForDeployment();
    console.log("VerifierOracle deployed to:", await verifierOracle.getAddress());

    // 3. Define High-Value Threshold
    const highValueThreshold = hre.ethers.parseUnits("100000", "ether");

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

    // 5. Add AssetRegistry as a signer to both MultiSigs
    const assetRegistryAddress = await assetRegistry.getAddress();
    
    console.log("Adding AssetRegistry as signer to MultiSigs...");
    
    // Add AssetRegistry to Standard MultiSig
    await standardMultiSigWallet.addSigner(assetRegistryAddress);
    console.log("AssetRegistry added to Standard MultiSig");
    
    // Add AssetRegistry to Bank MultiSig  
    await bankMultiSigWallet.addSigner(assetRegistryAddress);
    console.log("AssetRegistry added to Bank MultiSig");

    // 6. Get AssetNFT address
    const assetNftAddress = await assetRegistry.assetNft();
    console.log("AssetNFT (deployed by AssetRegistry) is at:", assetNftAddress);

    // 7. Save contract data
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

    const frontendDir = path.join(__dirname, '..', '..', 'frontend', 'src');
    fs.writeFileSync(
        path.join(frontendDir, 'contracts.json'),
        JSON.stringify(contractsData, null, 2)
    );

    console.log("Contract data saved to frontend/src/contracts.json");
    console.log("Deployment complete.");
    
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