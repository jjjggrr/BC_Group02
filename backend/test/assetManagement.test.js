const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AssetRegistry and AssetNFT", function () {
    let AssetNFT, assetNFT;
    let AssetRegistry, assetRegistry;
    let MultiSigWallet, // Factory
        standardMultiSigWallet, // Instance
        bankMultiSigWallet;     // Instance
    let VerifierOracle, verifierOracle;
    let deployer, admin, owner1, otherAccount, bankSignerAccount, anotherSignerAccount; // Added bankSignerAccount
    let standardSigners, bankSigners;

    const HIGH_VALUE_THRESHOLD = ethers.parseUnits("100000", "ether"); // Same as in deploy script
    const LOW_VALUE = ethers.parseUnits("1000", "ether");
    const HIGH_VALUE = ethers.parseUnits("200000", "ether");

    beforeEach(async function () {
        [deployer, admin, owner1, otherAccount, bankSignerAccount, anotherSignerAccount] = await ethers.getSigners();

        // Deploy MultiSigWallet Factory
        MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");

        // Deploy Standard MultiSigWallet
        standardSigners = [owner1.address, anotherSignerAccount.address]; // Example: owner1 and another party
        const standardReqConfirmations = 2;
        standardMultiSigWallet = await MultiSigWallet.deploy(standardSigners, standardReqConfirmations);
        await standardMultiSigWallet.waitForDeployment();

        // Deploy Bank MultiSigWallet
        bankSigners = [owner1.address, anotherSignerAccount.address, bankSignerAccount.address]; // Example: owner1, another party, bank
        const bankReqConfirmations = 3;
        bankMultiSigWallet = await MultiSigWallet.deploy(bankSigners, bankReqConfirmations);
        await bankMultiSigWallet.waitForDeployment();

        // Deploy VerifierOracle
        VerifierOracle = await ethers.getContractFactory("VerifierOracle");
        verifierOracle = await VerifierOracle.deploy();
        await verifierOracle.waitForDeployment();

        // Deploy AssetRegistry
        AssetRegistry = await ethers.getContractFactory("AssetRegistry");
        assetRegistry = await AssetRegistry.deploy(
            await standardMultiSigWallet.getAddress(),
            await bankMultiSigWallet.getAddress(),
            await verifierOracle.getAddress(),
            HIGH_VALUE_THRESHOLD
        );
        await assetRegistry.waitForDeployment();
        await standardMultiSigWallet.transferOwnership(await assetRegistry.getAddress());
        await bankMultiSigWallet.transferOwnership(await assetRegistry.getAddress());

        // AssetNFT
        const assetNFTAddress = await assetRegistry.assetNft();
        AssetNFT = await ethers.getContractFactory("AssetNFT");
        assetNFT = AssetNFT.attach(assetNFTAddress);
    });

    describe("Asset Registration (Minting)", function () {
        it("Should allow an admin to register a new asset (low value) and mint an NFT to an owner", async function () {
            const tokenIdToMint = 0;
            const assetDetails = "Luxury Watch, Serial: XYZ123";
            
            await expect(
                assetRegistry.connect(deployer).registerNewAsset(owner1.address, assetDetails, LOW_VALUE)
            ).to.emit(assetRegistry, "AssetRegistered")
             .withArgs(tokenIdToMint, owner1.address, assetDetails, LOW_VALUE);

            expect(await assetNFT.ownerOf(tokenIdToMint)).to.equal(owner1.address);

            const storedAssetData = await assetRegistry.assetDataStore(tokenIdToMint);
            expect(storedAssetData.assetDetails).to.equal(assetDetails); // Access by name
            expect(storedAssetData.value).to.equal(LOW_VALUE); // Access by name
        });

        it("Should allow an admin to register a new asset (high value) and mint an NFT to an owner", async function () {
            const tokenIdToMint = 0; // First token in this test context
            const assetDetails = "Rare Painting, ID: P789";
            
            await expect(
                assetRegistry.connect(deployer).registerNewAsset(owner1.address, assetDetails, HIGH_VALUE)
            ).to.emit(assetRegistry, "AssetRegistered")
             .withArgs(tokenIdToMint, owner1.address, assetDetails, HIGH_VALUE);

            expect(await assetNFT.ownerOf(tokenIdToMint)).to.equal(owner1.address);
            const storedAssetData = await assetRegistry.assetDataStore(tokenIdToMint);
            expect(storedAssetData.assetDetails).to.equal(assetDetails);
            expect(storedAssetData.value).to.equal(HIGH_VALUE);
        });


        it("Should increment tokenId for subsequent asset registrations", async function () {
            const assetDetails1 = "Artwork A";
            const assetDetails2 = "Artwork B";

            // Register first asset (tokenId 0)
            await assetRegistry.connect(deployer).registerNewAsset(owner1.address, assetDetails1, LOW_VALUE);
            expect(await assetNFT.ownerOf(0)).to.equal(owner1.address);

            // Register second asset (tokenId 1)
            await assetRegistry.connect(deployer).registerNewAsset(otherAccount.address, assetDetails2, HIGH_VALUE);
            expect(await assetNFT.ownerOf(1)).to.equal(otherAccount.address);

            const storedAssetData1 = await assetRegistry.assetDataStore(0);
            expect(storedAssetData1.assetDetails).to.equal(assetDetails1);
            expect(storedAssetData1.value).to.equal(LOW_VALUE);

            const storedAssetData2 = await assetRegistry.assetDataStore(1);
            expect(storedAssetData2.assetDetails).to.equal(assetDetails2);
            expect(storedAssetData2.value).to.equal(HIGH_VALUE);
        });

        it("Should prevent non-admins from registering a new asset", async function () {
            const assetDetails = "Forbidden Asset";
            const ADMIN_ROLE_HASH = await assetRegistry.ADMIN_ROLE();
            await expect(
                assetRegistry.connect(owner1).registerNewAsset(otherAccount.address, assetDetails, LOW_VALUE)
            ).to.be.revertedWithCustomError(assetRegistry, "AccessControlUnauthorizedAccount")
             .withArgs(owner1.address, ADMIN_ROLE_HASH);
        });
    });

    // "Asset Transfer (NFT)" tests for direct transfers remain the same.
    // They will still pass, showing direct transfers are possible.
    describe("Asset Transfer (NFT) - Direct", function () {
        let tokenIdToTransfer;
        const initialAssetDetails = "Direct Transfer Watch";

        beforeEach(async function() {
            const tx = await assetRegistry.connect(deployer).registerNewAsset(owner1.address, initialAssetDetails, LOW_VALUE); // Register with a value
            const receipt = await tx.wait();
            const event = receipt.logs.find(log => {
                try {
                    const parsedLog = assetRegistry.interface.parseLog(log);
                    return parsedLog && parsedLog.name === "AssetRegistered";
                } catch (error) { return false; }
            });
            if (event) { tokenIdToTransfer = event.args.tokenId; } 
            else { throw new Error("AssetRegistered event not found for direct transfer test setup."); }
        });

        it("Should allow the owner of an NFT to transfer it directly to another account", async function () {
            expect(await assetNFT.ownerOf(tokenIdToTransfer)).to.equal(owner1.address);
            await expect(
                assetNFT.connect(owner1).safeTransferFrom(owner1.address, otherAccount.address, tokenIdToTransfer)
            ).to.emit(assetNFT, "Transfer")
             .withArgs(owner1.address, otherAccount.address, tokenIdToTransfer);
            expect(await assetNFT.ownerOf(tokenIdToTransfer)).to.equal(otherAccount.address);
        });

        it("Should prevent non-owners from transferring an NFT directly", async function () {
            await expect(
                assetNFT.connect(deployer).safeTransferFrom(owner1.address, otherAccount.address, tokenIdToTransfer)
            ).to.be.revertedWithCustomError(assetNFT, "ERC721InsufficientApproval")
             .withArgs(deployer.address, tokenIdToTransfer);
        });

        it("Should prevent transferring a non-existent NFT directly", async function () {
            const nonExistentTokenId = 999;
            await expect(
                assetNFT.connect(owner1).safeTransferFrom(owner1.address, otherAccount.address, nonExistentTokenId)
            ).to.be.revertedWithCustomError(assetNFT, "ERC721NonexistentToken")
             .withArgs(nonExistentTokenId);
        });
    });

    // NEW describe block for initiateTransfer
    describe("Asset Transfer via AssetRegistry (MultiSig)", function () {
        let lowValueTokenId;
        let highValueTokenId;

        beforeEach(async function() {
            // Register a low-value asset to owner1
            let tx = await assetRegistry.connect(deployer).registerNewAsset(owner1.address, "LowValueCar", LOW_VALUE);
            let receipt = await tx.wait();
            let event = receipt.logs.find(log => { try { const p = assetRegistry.interface.parseLog(log); return p && p.name === "AssetRegistered"; } catch (e) { return false; } });
            if (event) { lowValueTokenId = event.args.tokenId; } else { throw new Error("Low value asset reg failed."); }

            // Register a high-value asset to owner1
            tx = await assetRegistry.connect(deployer).registerNewAsset(owner1.address, "HighValuePainting", HIGH_VALUE);
            receipt = await tx.wait();
            event = receipt.logs.find(log => { try { const p = assetRegistry.interface.parseLog(log); return p && p.name === "AssetRegistered"; } catch (e) { return false; } });
            if (event) { highValueTokenId = event.args.tokenId; } else { throw new Error("High value asset reg failed."); }

            // Ensure owner1 is a signer on both multi-sig wallets for these tests
            // (This was set up in the top-level beforeEach with standardSigners and bankSigners)
        });

        it("Should initiate and complete transfer for a LOW-VALUE asset via Standard MultiSig", async function () {
            // 1. Owner1 approves the Standard MultiSigWallet for the lowValueTokenId
            await assetNFT.connect(owner1).approve(await standardMultiSigWallet.getAddress(), lowValueTokenId);
            expect(await assetNFT.getApproved(lowValueTokenId)).to.equal(await standardMultiSigWallet.getAddress());
            console.log("owner1.address:", owner1.address);
            console.log("standardSigners:", standardSigners);
            console.log("bankSigners:", bankSigners);
            // 2. Owner1 initiates transfer through AssetRegistry
            await expect(assetRegistry.connect(owner1).initiateTransfer(lowValueTokenId, otherAccount.address))
                .to.emit(assetRegistry, "TransferInitiated")
                .withArgs(lowValueTokenId, owner1.address, otherAccount.address, await standardMultiSigWallet.getAddress(), 0); // Assuming txId 0 for first tx

            // 3. Signers (owner1, anotherSignerAccount) confirm on StandardMultiSigWallet
            // Note: MultiSigWallet transaction IDs are typically sequential (0, 1, 2...).
            const multiSigTxId = 0; // First transaction for this wallet instance in this test
            await standardMultiSigWallet.connect(owner1).confirmTransaction(multiSigTxId);
            await standardMultiSigWallet.connect(anotherSignerAccount).confirmTransaction(multiSigTxId); // This should execute it

            // 4. Verify NFT is transferred to otherAccount
            expect(await assetNFT.ownerOf(lowValueTokenId)).to.equal(otherAccount.address);
        });

        it("Should initiate and complete transfer for a HIGH-VALUE asset via Bank MultiSig", async function () {
            // 1. Owner1 approves the Bank MultiSigWallet for the highValueTokenId
            await assetNFT.connect(owner1).approve(await bankMultiSigWallet.getAddress(), highValueTokenId);
            expect(await assetNFT.getApproved(highValueTokenId)).to.equal(await bankMultiSigWallet.getAddress());

            // 2. Owner1 initiates transfer
            // Assuming this is the first transaction for bankMultiSigWallet in its lifetime for this test run, so txId might be 0.
            // If standardMultiSigWallet was used before, bankMultiSigWallet's tx count is independent.
            const expectedBankMultiSigTxId = await bankMultiSigWallet.transactionCount(); // Get current count before creating
            await expect(assetRegistry.connect(owner1).initiateTransfer(highValueTokenId, otherAccount.address))
                .to.emit(assetRegistry, "TransferInitiated")
                .withArgs(highValueTokenId, owner1.address, otherAccount.address, await bankMultiSigWallet.getAddress(), expectedBankMultiSigTxId);

            // 3. Signers (owner1, anotherSignerAccount, bankSignerAccount) confirm on BankMultiSigWallet
            await bankMultiSigWallet.connect(owner1).confirmTransaction(expectedBankMultiSigTxId);
            await bankMultiSigWallet.connect(anotherSignerAccount).confirmTransaction(expectedBankMultiSigTxId);
            await bankMultiSigWallet.connect(bankSignerAccount).confirmTransaction(expectedBankMultiSigTxId); // This should execute

            // 4. Verify NFT is transferred
            expect(await assetNFT.ownerOf(highValueTokenId)).to.equal(otherAccount.address);
        });

        it("Should fail to initiate transfer if MultiSigWallet is not approved", async function () {
            // owner1 does NOT approve any multisig wallet
            await expect(
                assetRegistry.connect(owner1).initiateTransfer(lowValueTokenId, otherAccount.address)
            ).to.be.revertedWith("AssetRegistry: Chosen MultiSigWallet not approved for this token.");
        });
    });

    describe("Asset Value Management", function () {
        let assetId;
        const initialValue = ethers.parseUnits("50000", "ether"); // e.g., $50,000
        let certifiedProfessional;

        beforeEach(async function() {
            // Use 'anotherSignerAccount' as our certified professional for this test
            certifiedProfessional = anotherSignerAccount;

            // Grant the role to our designated professional
            await assetRegistry.connect(deployer).grantCertifiedProfessionalRole(certifiedProfessional.address);

            // Register a new asset to test with
            const tx = await assetRegistry.connect(deployer).registerNewAsset(owner1.address, "Test Car", initialValue);
            const receipt = await tx.wait();
            const event = receipt.logs.find(log => { try { const p = assetRegistry.interface.parseLog(log); return p && p.name === "AssetRegistered"; } catch (e) { return false; } });
            assetId = event.args.tokenId;
        });

        it("Should allow a certified professional to update an asset's value", async function () {
            const newValue = ethers.parseUnits("20000", "ether"); // Value reduced after an "accident"
            
            await expect(assetRegistry.connect(certifiedProfessional).updateAssetValue(assetId, newValue))
                .to.emit(assetRegistry, "AssetValueUpdated")
                .withArgs(assetId, newValue, certifiedProfessional.address);

            const storedAssetData = await assetRegistry.assetDataStore(assetId);
            expect(storedAssetData.value).to.equal(newValue);
        });

        it("Should prevent a non-certified user from updating an asset's value", async function () {
            const newValue = ethers.parseUnits("60000", "ether");
            const CERTIFIED_PROFESSIONAL_ROLE_HASH = await assetRegistry.CERTIFIED_PROFESSIONAL_ROLE();

            // The owner of the asset tries to fraudulently increase its value
            await expect(
                assetRegistry.connect(owner1).updateAssetValue(assetId, newValue)
            ).to.be.revertedWithCustomError(assetRegistry, "AccessControlUnauthorizedAccount")
             .withArgs(owner1.address, CERTIFIED_PROFESSIONAL_ROLE_HASH);
        });

        it("Should prevent updating the value of a non-existent asset", async function () {
            const nonExistentTokenId = 999;
            const newValue = ethers.parseUnits("10000", "ether");

            await expect(
                assetRegistry.connect(certifiedProfessional).updateAssetValue(nonExistentTokenId, newValue)
            ).to.be.revertedWith("Asset does not exist or not fully registered.");
        });
    });
});