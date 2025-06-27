const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Find the actual project root (go up one level from backend)
    const projectRoot = path.resolve(__dirname, '..', '..');
    const contractsPath = path.join(projectRoot, 'frontend', 'src', 'contracts.json');
    
    console.log("Project root:", projectRoot);
    console.log("Contracts file path:", contractsPath);
    
    // Verify the file exists before trying to read it
    if (!fs.existsSync(contractsPath)) {
        console.error("ERROR: contracts.json not found at:", contractsPath);
        
        // List what's actually in the frontend/src directory for debugging
        const frontendSrcPath = path.join(projectRoot, 'frontend', 'src');
        if (fs.existsSync(frontendSrcPath)) {
            console.log("Files in frontend/src/:", fs.readdirSync(frontendSrcPath));
        } else {
            console.log("frontend/src directory doesn't exist");
        }
        return;
    }
    
    const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
    const REGISTRY_ADDRESS = contractsData.AssetRegistry.address;
    
    console.log("Using latest contract address:", REGISTRY_ADDRESS);
    console.log("Deployer address:", deployer.address);
    
    // Your MetaMask address
    const YOUR_METAMASK_ADDRESS = "0x9d697488e556BB41308fFa71370ae4E93F5D484C";
    
    const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
    const registry = AssetRegistry.attach(REGISTRY_ADDRESS);
    
    // Check if deployer has DEFAULT_ADMIN_ROLE first
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const hasDefaultAdmin = await registry.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    console.log("Deployer has DEFAULT_ADMIN_ROLE:", hasDefaultAdmin);
    
    if (!hasDefaultAdmin) {
        console.error("ERROR: Deployer doesn't have DEFAULT_ADMIN_ROLE. Cannot grant roles.");
        return;
    }
    
    // Grant roles with transaction receipts
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const CERTIFIED_PROFESSIONAL_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CERTIFIED_PROFESSIONAL_ROLE"));
    const BANK_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BANK_ROLE"));
    
    try {
        console.log("Granting ADMIN_ROLE to", YOUR_METAMASK_ADDRESS);
        const tx1 = await registry.grantRole(ADMIN_ROLE, YOUR_METAMASK_ADDRESS);
        await tx1.wait();
        console.log("✅ ADMIN_ROLE granted, tx:", tx1.hash);
        
        console.log("Granting CERTIFIED_PROFESSIONAL_ROLE to", YOUR_METAMASK_ADDRESS);
        const tx2 = await registry.grantRole(CERTIFIED_PROFESSIONAL_ROLE, YOUR_METAMASK_ADDRESS);
        await tx2.wait();
        console.log("✅ CERTIFIED_PROFESSIONAL_ROLE granted, tx:", tx2.hash);
        
        console.log("Granting BANK_ROLE to", YOUR_METAMASK_ADDRESS);
        const tx3 = await registry.grantRole(BANK_ROLE, YOUR_METAMASK_ADDRESS);
        await tx3.wait();
        console.log("✅ BANK_ROLE granted, tx:", tx3.hash);
        
        // Verify roles were granted
        console.log("\n=== VERIFICATION ===");
        const hasAdmin = await registry.hasRole(ADMIN_ROLE, YOUR_METAMASK_ADDRESS);
        const hasCert = await registry.hasRole(CERTIFIED_PROFESSIONAL_ROLE, YOUR_METAMASK_ADDRESS);
        const hasBank = await registry.hasRole(BANK_ROLE, YOUR_METAMASK_ADDRESS);
        
        console.log("Target has ADMIN_ROLE:", hasAdmin);
        console.log("Target has CERTIFIED_PROFESSIONAL_ROLE:", hasCert);
        console.log("Target has BANK_ROLE:", hasBank);
        
        console.log("All roles granted successfully!");
        
    } catch (error) {
        console.error("Error granting roles:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });