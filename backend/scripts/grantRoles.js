const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Replace with your deployed contract address
    const REGISTRY_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    
    // Replace with your MetaMask address
    const YOUR_METAMASK_ADDRESS = "0x9d697488e556BB41308fFa71370ae4E93F5D484C";
    
    const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
    const registry = AssetRegistry.attach(REGISTRY_ADDRESS);
    
    // Grant roles
    const ASSET_REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ASSET_REGISTRAR_ROLE"));
    const CERTIFIED_PROFESSIONAL_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CERTIFIED_PROFESSIONAL_ROLE"));
    
    console.log("Granting ASSET_REGISTRAR_ROLE to", YOUR_METAMASK_ADDRESS);
    await registry.grantRole(ASSET_REGISTRAR_ROLE, YOUR_METAMASK_ADDRESS);
    
    console.log("Granting CERTIFIED_PROFESSIONAL_ROLE to", YOUR_METAMASK_ADDRESS);
    await registry.grantRole(CERTIFIED_PROFESSIONAL_ROLE, YOUR_METAMASK_ADDRESS);
    
    console.log("Roles granted successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });