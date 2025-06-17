const { expect } = require("chai");
const { ethers } = require("hardhat");
// Test with npx hardhat test
describe("AssetRegistry and AssetNFT", function () {
    let AssetNFT, assetNFT;
    let AssetRegistry, assetRegistry;
    let MultiSigWallet, multiSigWallet;
    let VerifierOracle, verifierOracle;
    let deployer, admin, owner1, otherAccount;

    // Roles (as bytes32, matching AccessControl setup)
    // You can get these by calling e.g. assetRegistry.ADMIN_ROLE() in a script
    // or by computing them: ethers.utils.id("ADMIN_ROLE") or ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"))
    // For simplicity, let's assume you have constants or will fetch them.
    // If AssetRegistry grants ADMIN_ROLE to deployer in constructor, this is fine.
    // const ADMIN_ROLE = ethers.utils.id("ADMIN_ROLE"); // Example

    beforeEach(async function () {
        [deployer, admin, owner1, otherAccount] = await ethers.getSigners();

        // Deploy MultiSigWallet
        MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
        const initialSigners = [deployer.address, admin.address]; // Example signers
        const requiredConfirmations = 1; // Example
        multiSigWallet = await MultiSigWallet.deploy(initialSigners, requiredConfirmations);
        await multiSigWallet.waitForDeployment();

        // Deploy VerifierOracle
        VerifierOracle = await ethers.getContractFactory("VerifierOracle");
        verifierOracle = await VerifierOracle.deploy(); // Assumes no constructor args
        await verifierOracle.waitForDeployment();

        // Deploy AssetRegistry
        AssetRegistry = await ethers.getContractFactory("AssetRegistry");
        assetRegistry = await AssetRegistry.deploy(
            await multiSigWallet.getAddress(),
            await verifierOracle.getAddress()
        );
        await assetRegistry.waitForDeployment();

        // AssetNFT is deployed by AssetRegistry's constructor. Get its address.
        const assetNFTAddress = await assetRegistry.assetNft();
        AssetNFT = await ethers.getContractFactory("AssetNFT"); // Get factory to attach
        assetNFT = AssetNFT.attach(assetNFTAddress);

        // Grant ADMIN_ROLE to the 'admin' signer if not already done by constructor for deployer
        // For this test, we'll assume deployer (who deploys AssetRegistry) has ADMIN_ROLE by default.
        // If you need a different admin:
        // const ADMIN_ROLE_HASH = await assetRegistry.ADMIN_ROLE();
        // await assetRegistry.connect(deployer).grantRole(ADMIN_ROLE_HASH, admin.address);
    });

        describe("Asset Registration (Minting)", function () {
        it("Should allow an admin to register a new asset and mint an NFT to an owner", async function () {
            const tokenIdToMint = 0; // First token
            const assetDetails = "Luxury Watch, Serial: XYZ123";

            await expect(
                assetRegistry.connect(deployer).registerNewAsset(owner1.address, assetDetails)
            ).to.emit(assetRegistry, "AssetRegistered")
             .withArgs(tokenIdToMint, owner1.address, assetDetails);

            expect(await assetNFT.ownerOf(tokenIdToMint)).to.equal(owner1.address);

            const storedAssetData = await assetRegistry.assetDataStore(tokenIdToMint);
            
            // --- Debugging Logs (can be removed or commented out after fixing) ---
            console.log("DEBUG: Test reached before assertion for token:", tokenIdToMint);
            console.log("DEBUG: storedAssetData raw object is:", storedAssetData);
            try {
                console.log("DEBUG: JSON.stringify(storedAssetData) is:", JSON.stringify(storedAssetData));
            } catch (e) {
                console.log("DEBUG: Error during JSON.stringify:", e);
            }
            // --- End Debugging Logs ---

            // storedAssetData is directly the assetDetails string
            expect(storedAssetData).to.equal(assetDetails); 

            // To check lifecycleHistory, you'd ideally need an explicit getter in the contract
            // if assetDataStore(tokenId) only returns the string when history is empty.
            // For now, we can't directly check storedAssetData[1].length if storedAssetData is a string.
            // If you add a getter like `getLifecycleHistory(tokenId)` in AssetRegistry.sol:
            // const history = await assetRegistry.getLifecycleHistory(tokenIdToMint);
            // expect(history.length).to.equal(0);
        });
        

        it("Should increment tokenId for subsequent asset registrations", async function () {
            const assetDetails1 = "Artwork A";
            const assetDetails2 = "Artwork B";

            await assetRegistry.connect(deployer).registerNewAsset(owner1.address, assetDetails1);
            expect(await assetNFT.ownerOf(0)).to.equal(owner1.address);

            await assetRegistry.connect(deployer).registerNewAsset(otherAccount.address, assetDetails2);
            expect(await assetNFT.ownerOf(1)).to.equal(otherAccount.address);

            const storedAssetData1 = await assetRegistry.assetDataStore(0);
            // --- Debugging Logs (can be removed or commented out after fixing) ---
            console.log("DEBUG: storedAssetData1 for token 0 is:", JSON.stringify(storedAssetData1));
            // --- End Debugging Logs ---
            expect(storedAssetData1).to.equal(assetDetails1); 

            const storedAssetData2 = await assetRegistry.assetDataStore(1);
            // --- Debugging Logs (can be removed or commented out after fixing) ---
            console.log("DEBUG: storedAssetData2 for token 1 is:", JSON.stringify(storedAssetData2));
            // --- End Debugging Logs ---
            expect(storedAssetData2).to.equal(assetDetails2); 
        });

        it("Should prevent non-admins from registering a new asset", async function () {
            const assetDetails = "Forbidden Asset";
            const ADMIN_ROLE_HASH = await assetRegistry.ADMIN_ROLE();

            // Check for the custom error AccessControlUnauthorizedAccount
            // The error takes two arguments: the account and the required role
            await expect(
                assetRegistry.connect(owner1).registerNewAsset(otherAccount.address, assetDetails)
            ).to.be.revertedWithCustomError(assetRegistry, "AccessControlUnauthorizedAccount")
             .withArgs(owner1.address, ADMIN_ROLE_HASH); // Verify the account and role in the error
        });
    }); // End of "Asset Registration (Minting)" describe block

    describe("Asset Transfer (NFT)", function () {
        let tokenIdToTransfer; // We will get this from the minting transaction
        const initialAssetDetails = "Transferable Watch, Serial: TXYZ789";

        beforeEach(async function() {
            // Mint an NFT to owner1 specifically for these transfer tests.
            // The actual tokenId will be determined by AssetRegistry's _nextTokenId.
            const tx = await assetRegistry.connect(deployer).registerNewAsset(owner1.address, initialAssetDetails);
            const receipt = await tx.wait();

            // Find the AssetRegistered event to get the tokenId
            const event = receipt.logs.find(log => {
                try {
                    const parsedLog = assetRegistry.interface.parseLog(log);
                    return parsedLog && parsedLog.name === "AssetRegistered";
                } catch (error) {
                    return false; // Ignore logs that can't be parsed by this interface
                }
            });

            if (event) {
                tokenIdToTransfer = event.args.tokenId;
            } else {
                throw new Error("AssetRegistered event not found after minting for transfer test setup.");
            }
            // owner1 now owns tokenIdToTransfer
        });

        it("Should allow the owner of an NFT to transfer it to another account", async function () {
            // owner1 is the current owner of tokenIdToTransfer
            // otherAccount will be the new owner

            // Verify initial owner
            expect(await assetNFT.ownerOf(tokenIdToTransfer)).to.equal(owner1.address);

            // Perform the transfer from owner1 to otherAccount
            // safeTransferFrom(from, to, tokenId)
            await expect(
                assetNFT.connect(owner1).safeTransferFrom(owner1.address, otherAccount.address, tokenIdToTransfer)
            ).to.emit(assetNFT, "Transfer")
             .withArgs(owner1.address, otherAccount.address, tokenIdToTransfer);

            // Verify new owner
            expect(await assetNFT.ownerOf(tokenIdToTransfer)).to.equal(otherAccount.address);
        });

        it("Should prevent non-owners from transferring an NFT", async function () {
            // deployer is not the owner of tokenIdToTransfer (owner1 is)
            // The sender (deployer) is not the owner and has no approval.
            await expect(
                assetNFT.connect(deployer).safeTransferFrom(owner1.address, otherAccount.address, tokenIdToTransfer)
            ).to.be.revertedWithCustomError(assetNFT, "ERC721InsufficientApproval")
             .withArgs(deployer.address, tokenIdToTransfer); // operator, tokenId
            // Alternative if the above is not the exact error:
            // ).to.be.revertedWithCustomError(assetNFT, "ERC721IncorrectOwner")
            //  .withArgs(deployer.address, tokenIdToTransfer, owner1.address); // sender, tokenId, owner
        });

        it("Should prevent transferring an NFT that does not exist", async function () {
            const nonExistentTokenId = 999;
            await expect(
                assetNFT.connect(owner1).safeTransferFrom(owner1.address, otherAccount.address, nonExistentTokenId)
            ).to.be.revertedWithCustomError(assetNFT, "ERC721NonexistentToken")
             .withArgs(nonExistentTokenId); // tokenId
        });
    }); 

});