const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Asset Management DApp", function () {
    let assetNFT, assetRegistry, multiSigWallet, verifierOracle;
    let owner, certifiedProfessional, bank, user;

    beforeEach(async function () {
        [owner, certifiedProfessional, bank, user] = await ethers.getSigners();

        const AssetNFT = await ethers.getContractFactory("AssetNFT");
        assetNFT = await AssetNFT.deploy(owner.address);

        const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
        assetRegistry = await AssetRegistry.deploy();

        const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
        multiSigWallet = await MultiSigWallet.deploy([owner.address, bank.address], 2);

        const VerifierOracle = await ethers.getContractFactory("VerifierOracle");
        verifierOracle = await VerifierOracle.deploy();
    });

    describe("AssetNFT", function () {
        it("should mint a new NFT", async function () {
            await assetNFT.safeMint(user.address, 1);
            expect(await assetNFT.ownerOf(1)).to.equal(user.address);
        });
    });

    describe("AssetRegistry", function () {
        it("should register a new asset", async function () {
            await assetRegistry.registerNewAsset(user.address, "Asset Details");
            const assetData = await assetRegistry.assetDataStore(0);
            expect(assetData.assetDetails).to.equal("Asset Details");
        });
    });

    describe("MultiSigWallet", function () {
        it("should execute a transaction with multiple signatures", async function () {
            const tx = {
                to: user.address,
                value: ethers.utils.parseEther("1.0"),
            };
            await multiSigWallet.submitTransaction(tx.to, tx.value);
            await multiSigWallet.confirmTransaction(0);
            await multiSigWallet.confirmTransaction(0);
            await multiSigWallet.executeTransaction(0);
            expect(await ethers.provider.getBalance(user.address)).to.equal(ethers.utils.parseEther("1.0"));
        });
    });

    describe("VerifierOracle", function () {
        it("should verify asset valuation", async function () {
            const isValid = await verifierOracle.verify("Asset Details", 1000);
            expect(isValid).to.be.true;
        });
    });
});