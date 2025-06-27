import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import contractsData from './contracts.json';
import AssetRegistryAbi from './abi/AssetRegistry.json';    
import AssetNFTAbi from './abi/AssetNFT.json';
import LandingPage from "./LandingPage";
import MainContent from "./components/MainContent";

const REGISTRY_ADDRESS = contractsData.AssetRegistry.address; 

function App() {
    // --- State for Wallet and Contracts ---
    const [signer, setSigner] = useState(null);
    const [registryContract, setRegistryContract] = useState(null);
    const [signerAddress, setSignerAddress] = useState('');

    // --- State for UI ---
    const [activePage, setActivePage] = useState('dashboard');
    const [logs, setLogs] = useState([]);
    const [assetData, setAssetData] = useState(null);
    const [tokenId, setTokenId] = useState('');

    // --- State for Forms ---
    const [regAssetName, setRegAssetName] = useState('');
    const [regSerialNumber, setRegSerialNumber] = useState('');
    const [regCategory, setRegCategory] = useState('');
    const [regLocation, setRegLocation] = useState('');
    const [regValue, setRegValue] = useState('');

    const [eventTokenId, setEventTokenId] = useState('');
    const [eventType, setEventType] = useState('');
    const [eventDescription, setEventDescription] = useState('');

    const [transferTokenId, setTransferTokenId] = useState('');
    const [transferToAddress, setTransferToAddress] = useState('');

    // --- State for owned tokens ---
    const [ownedTokens, setOwnedTokens] = useState([]);
    const [loadingTokens, setLoadingTokens] = useState(false);

    // --- Network Configuration ---
    const MORPHEUS_NETWORK = {
        chainId: '0x525',
        chainName: 'instructoruas',
        nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['http://instructoruas-28364.morpheuslabs.io'],
        blockExplorerUrls: ['']
    };

    // --- Network Functions ---
    const switchToMorpheusNetwork = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: MORPHEUS_NETWORK.chainId }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [MORPHEUS_NETWORK],
                    });
                } catch (addError) {
                    console.error('Failed to add Morpheus network:', addError);
                    alert('Failed to add Morpheus network to MetaMask');
                }
            } else {
                console.error('Failed to switch to Morpheus network:', switchError);
                alert('Please switch to Morpheus Labs network in MetaMask');
            }
        }
    };

    // --- Wallet Connection ---
    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                await switchToMorpheusNetwork();
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                
                const web3Provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await web3Provider.getSigner();
                const address = await signer.getAddress();
                
                const registry = new ethers.Contract(
                    REGISTRY_ADDRESS,
                    contractsData.AssetRegistry.abi,
                    signer
                );
                
                setSigner(signer);
                setSignerAddress(address);
                setRegistryContract(registry);
                
                addLog("Connected", `Wallet connected: ${address}`);
                
                console.log("Wallet connected successfully:", address);
                console.log("Registry contract:", REGISTRY_ADDRESS);
                
            } catch (error) {
                console.error("Error connecting wallet:", error);
                alert("Failed to connect wallet: " + error.message);
            }
        } else {
            alert("Please install MetaMask to use this application!");
        }
    };

        // Add this useEffect after your state declarations
    useEffect(() => {
        if (registryContract && signer) {
            fetchOwnedTokens();
        }
    }, [registryContract, signer]);
    
        // Update the registry data parsing section in fetchOwnedTokens
    const fetchOwnedTokens = async () => {
        if (!registryContract || !signer) return;
        
        setLoadingTokens(true);
        try {
            const address = await signer.getAddress();
            
            // Get AssetNFT contract
            const assetNftAddress = await registryContract.assetNft();
            const assetNft = new ethers.Contract(
                assetNftAddress, 
                contractsData.AssetNFT.abi, 
                signer
            );
            
            // Get balance (number of NFTs owned)
            const balance = await assetNft.balanceOf(address);
            console.log(`User owns ${balance} NFTs`);
            
            const tokens = [];
            
            // Loop through all owned tokens
            for (let i = 0; i < balance; i++) {
                try {
                    let tokenId;
                    
                    // Try tokenOfOwnerByIndex first
                    try {
                        tokenId = await assetNft.tokenOfOwnerByIndex(address, i);
                    } catch (enumerableError) {
                        console.log("tokenOfOwnerByIndex not available, trying alternative approach");
                        // Fallback approach - check tokens 0 through 99
                        let found = false;
                        for (let testId = 0; testId < 100 && !found; testId++) {
                            try {
                                const owner = await assetNft.ownerOf(testId);
                                if (owner.toLowerCase() === address.toLowerCase()) {
                                    tokenId = testId;
                                    found = true;
                                }
                            } catch (e) {
                                // Token doesn't exist, continue
                            }
                        }
                        if (!found) break;
                    }
                    
                    console.log(`Found token ID: ${tokenId}`);
                    
                    // Get registry data for this token
                    let registryData = null;
                    let parsedDetails = {};
                    let value = "0";
                    let lifecycleHistory = [];
                    
                    try {
                        registryData = await registryContract.assetDataStore(tokenId);
                        console.log(`Registry data for token ${tokenId}:`, registryData);
                        
                        // FIX: Access by index instead of property names
                        // registryData[0] = assetDetails
                        // registryData[1] = value  
                        // registryData[2] = owner
                        // registryData[3] = exists
                        
                        if (registryData[0]) { // registryData[0] is assetDetails
                            try {
                                parsedDetails = JSON.parse(registryData[0]);
                                console.log(`Parsed details for token ${tokenId}:`, parsedDetails);
                            } catch (e) {
                                console.log(`Failed to parse JSON, using as string:`, registryData[0]);
                                parsedDetails = { name: registryData[0] };
                            }
                        } else {
                            console.log(`No assetDetails for token ${tokenId}`);
                        }
                        
                        value = registryData[1] || "0"; // registryData[1] is value
                        lifecycleHistory = []; // We'll need to get this separately since it's not returned by the public mapping
                        
                    } catch (e) {
                        console.log(`No registry data for token ${tokenId}:`, e);
                        parsedDetails = { name: 'Unknown Asset' };
                    }

                    try {
                    // Get lifecycle history for each token
                    lifecycleHistory = await registryContract.getLifecycleHistory(tokenId);
                    console.log(`Lifecycle history for token ${tokenId}:`, lifecycleHistory);
                } catch (e) {
                    console.log(`No lifecycle history for token ${tokenId}:`, e);
                    lifecycleHistory = [];
                }
                    
                    // Get token URI for metadata (if your NFT contract supports it)
                    let tokenURI = null;
                    try {
                        tokenURI = await assetNft.tokenURI(tokenId);
                    } catch (e) {
                        console.log(`No tokenURI for token ${tokenId}`);
                    }
                    
                    tokens.push({
                        tokenId: tokenId.toString(),
                        owner: address,
                        registryData: registryData,
                        tokenURI: tokenURI,
                        parsedDetails: parsedDetails,
                        value: value,
                        lifecycleHistory: lifecycleHistory
                    });
                    
                } catch (error) {
                    console.error(`Error fetching token at index ${i}:`, error);
                }
            }
            
            setOwnedTokens(tokens);
            addLog("Success", `Found ${tokens.length} owned tokens`);
            
        } catch (error) {
            console.error("Error fetching owned tokens:", error);
            addLog("Error", "Failed to fetch owned tokens: " + error.message);
        } finally {
            setLoadingTokens(false);
        }
    };
    
    // --- Utility Functions ---
    const addLog = (action, details) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prevLogs => [{ timestamp, action, details }, ...prevLogs.slice(0, 49)]); // Keep last 50 logs
    };

    const checkMyRoles = async () => {
    if (!registryContract || !signer) return;
    
    try {
        const userAddress = await signer.getAddress();
        
        const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const CERT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CERTIFIED_PROFESSIONAL_ROLE"));
        const BANK_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BANK_ROLE"));
        
        const hasAdmin = await registryContract.hasRole(ADMIN_ROLE, userAddress);
        const hasCert = await registryContract.hasRole(CERT_ROLE, userAddress);
        const hasBank = await registryContract.hasRole(BANK_ROLE, userAddress);
        
        console.log("=== ROLE CHECK ===");
        console.log("User Address:", userAddress);
        console.log("Has ADMIN_ROLE:", hasAdmin);
        console.log("Has CERTIFIED_PROFESSIONAL_ROLE:", hasCert);
        console.log("Has BANK_ROLE:", hasBank);
        
        alert(`Roles:\nADMIN: ${hasAdmin}\nCERTIFIED_PROFESSIONAL: ${hasCert}\nBANK: ${hasBank}`);
        
    } catch (error) {
        console.error("Error checking roles:", error);
    }
};
    
    // Function to fetch asset data by token ID
    const fetchAssetData = async () => {
    if (registryContract && tokenId) {
        try {
            addLog("Fetching...", `Requesting data for token ID: ${tokenId}`);
            
            const data = await registryContract.assetDataStore(tokenId);
            
            console.log("Raw asset data:", data);
            
            // Access by index instead of property names
            const assetDetails = data[0];  // assetDetails
            const value = data[1];         // value
            const owner = data[2];         // owner  
            const exists = data[3];        // exists
            
            // Check if asset exists
            if (!exists) {
                setAssetData(null);
                addLog("Error", `Asset with token ID ${tokenId} does not exist in registry`);
                alert(`Asset with token ID ${tokenId} does not exist in registry`);
                return;
            }
            
            // Get lifecycle history separately
            let lifecycleHistory = [];
            try {
                lifecycleHistory = await registryContract.getLifecycleHistory(tokenId);
                console.log("Lifecycle history:", lifecycleHistory);
            } catch (error) {
                console.log("No lifecycle history or error getting it:", error);
            }
            
            // Create asset data object with proper structure
            const assetDataObj = {
                assetDetails: assetDetails,
                value: value,
                owner: owner,
                exists: exists,
                lifecycleHistory: lifecycleHistory
            };
            
            setAssetData(assetDataObj);
            addLog("Success", `Data received for token ID: ${tokenId} with ${lifecycleHistory.length} events`);
        } catch (error) {
            console.error("Error fetching asset data:", error);
            setAssetData(null);
            addLog("Error", `Failed to fetch data for token ID: ${tokenId} - ${error.message}`);
        }
    }
};

const debugAssetTransfer = async (tokenId) => {
    if (!registryContract) return;
    
    try {
        console.log("=== DEBUGGING TOKEN ===");
        console.log("Token ID:", tokenId);
        
        // First check if the asset exists
        const assetData = await registryContract.assetDataStore(tokenId);
        console.log("Raw assetData:", assetData);
        
        // Check if assetData is valid and has the expected structure
        if (!assetData || assetData.length < 4) {
            console.error("Asset data is invalid or incomplete:", assetData);
            return;
        }
        
        // Access by index since it's a struct tuple
        const assetDetails = assetData[0];  // string
        const value = assetData[1];         // uint256
        const owner = assetData[2];         // address
        const exists = assetData[3];        // bool
        
        console.log("Asset exists:", exists);
        
        if (!exists) {
            console.error("Asset does not exist in registry");
            return;
        }
        
        const threshold = await registryContract.highValueThreshold();
        
        console.log("=== ASSET VALUE DEBUG ===");
        console.log("Token ID:", tokenId);
        console.log("Asset value (wei):", value.toString());
        console.log("Asset value (ETH):", ethers.formatEther(value));
        console.log("Threshold (wei):", threshold.toString());
        console.log("Threshold (ETH):", ethers.formatEther(threshold));
        console.log("Is high value?", value >= threshold);
        console.log("Should use bank MultiSig?", value > threshold);
        console.log("========================");
        
        // Also check the transfer path logic
        const standardMultiSig = await registryContract.standardMultiSigWallet();
        const bankMultiSig = await registryContract.bankMultiSigWallet();
        
        console.log("Standard MultiSig:", standardMultiSig);
        console.log("Bank MultiSig:", bankMultiSig);
        
    } catch (error) {
        console.error("Debug error:", error);
        
        // Try to get more specific error information
        if (error.reason) {
            console.error("Error reason:", error.reason);
        }
        if (error.code) {
            console.error("Error code:", error.code);
        }
    }
};

const debugCompleteTransferFlow = async (tokenId) => {
    if (!registryContract || !signer) return;
    
    try {
        console.log("=== COMPLETE TRANSFER DEBUG ===");
        
        // 1. Check what account MetaMask is actually using
        const currentAccount = await signer.getAddress();
        console.log("MetaMask Account:", currentAccount);
        
        // 2. Check the asset data
        const assetData = await registryContract.assetDataStore(tokenId);
        console.log("Asset Owner:", assetData[2]);
        console.log("Asset Value (ETH):", ethers.formatEther(assetData[1]));
        
        // 3. Check threshold and which MultiSig should be used
        const threshold = await registryContract.highValueThreshold();
        const usesBankMultiSig = assetData[1] > threshold;
        console.log("Uses Bank MultiSig:", usesBankMultiSig);
        
        // 4. Get the actual MultiSig addresses
        const standardMultiSigAddr = await registryContract.standardMultiSigWallet();
        const bankMultiSigAddr = await registryContract.bankMultiSigWallet();
        console.log("Standard MultiSig:", standardMultiSigAddr);
        console.log("Bank MultiSig:", bankMultiSigAddr);
        
        // 5. Check if current account is authorized on BOTH MultiSigs
        // FIXED: Use contract ABI instead of getContractFactory
        try {
            // You'll need to import or define the MultiSigWallet ABI
            // For now, let's create a minimal ABI with just the functions we need
            const multiSigAbi = [
                "function isOwner(address) view returns (bool)",
                "function getOwners() view returns (address[])"
            ];
            
            const standardMultiSig = new ethers.Contract(standardMultiSigAddr, multiSigAbi, signer);
            const isStandardOwner = await standardMultiSig.isOwner(currentAccount);
            console.log("Is owner of Standard MultiSig:", isStandardOwner);
            
            // Get all owners of standard MultiSig
            const standardOwners = await standardMultiSig.getOwners();
            console.log("Standard MultiSig owners:", standardOwners);
        } catch (e) {
            console.error("Error checking Standard MultiSig:", e.message);
        }
        
        // Check Bank MultiSig
        try {
            const multiSigAbi = [
                "function isOwner(address) view returns (bool)",
                "function getOwners() view returns (address[])"
            ];
            
            const bankMultiSig = new ethers.Contract(bankMultiSigAddr, multiSigAbi, signer);
            const isBankOwner = await bankMultiSig.isOwner(currentAccount);
            console.log("Is owner of Bank MultiSig:", isBankOwner);
            
            // Get all owners of bank MultiSig
            const bankOwners = await bankMultiSig.getOwners();
            console.log("Bank MultiSig owners:", bankOwners);
        } catch (e) {
            console.error("Error checking Bank MultiSig:", e.message);
        }
        
        // 6. Check which network MetaMask is connected to
        const network = await signer.provider.getNetwork();
        console.log("Connected Network Chain ID:", network.chainId);
        
        console.log("=== END DEBUG ===");
        
    } catch (error) {
        console.error("Complete debug error:", error);
    }
};
    const checkContractExistence = async () => {
    if (!registryContract || !signer) return;
    
    try {
        const standardMultiSigAddr = await registryContract.standardMultiSigWallet();
        const bankMultiSigAddr = await registryContract.bankMultiSigWallet();
        
        console.log("=== CONTRACT EXISTENCE CHECK ===");
        
        // Check if contracts have code (exist)
        const standardCode = await signer.provider.getCode(standardMultiSigAddr);
        const bankCode = await signer.provider.getCode(bankMultiSigAddr);
        
        console.log("Standard MultiSig address:", standardMultiSigAddr);
        console.log("Standard MultiSig has code:", standardCode !== "0x");
        console.log("Bank MultiSig address:", bankMultiSigAddr);
        console.log("Bank MultiSig has code:", bankCode !== "0x");
        
        if (standardCode === "0x") {
            console.error("❌ Standard MultiSig contract doesn't exist!");
        }
        if (bankCode === "0x") {
            console.error("❌ Bank MultiSig contract doesn't exist!");
        }
        
    } catch (error) {
        console.error("Error checking contracts:", error);
    }
};

        const debugSignerStatus = async () => {
        if (!registryContract || !signer) return;
        
        try {
            const currentAccount = await signer.getAddress();
            const bankMultiSigAddr = await registryContract.bankMultiSigWallet();
            const standardMultiSigAddr = await registryContract.standardMultiSigWallet();
            
            console.log("=== SIGNER STATUS DEBUG ===");
            console.log("Your account:", currentAccount);
            
            // Check both MultiSigs
            const multiSigAbi = [
                "function isSigner(address) view returns (bool)",
                "function owner() view returns (address)",
                "function getSigners() view returns (address[])",
                "function requiredConfirmations() view returns (uint256)"
            ];
            
            // Check Standard MultiSig
            const standardMultiSig = new ethers.Contract(standardMultiSigAddr, multiSigAbi, signer);
            const isStandardSigner = await standardMultiSig.isSigner(currentAccount);
            const standardOwner = await standardMultiSig.owner();
            const standardSigners = await standardMultiSig.getSigners();
            const standardRequired = await standardMultiSig.requiredConfirmations();
            
            console.log("--- Standard MultiSig ---");
            console.log("Address:", standardMultiSigAddr);
            console.log("You are signer:", isStandardSigner);
            console.log("Owner:", standardOwner);
            console.log("All signers:", standardSigners);
            console.log("Required confirmations:", standardRequired.toString());
            
            // Check Bank MultiSig
            const bankMultiSig = new ethers.Contract(bankMultiSigAddr, multiSigAbi, signer);
            const isBankSigner = await bankMultiSig.isSigner(currentAccount);
            const bankOwner = await bankMultiSig.owner();
            const bankSigners = await bankMultiSig.getSigners();
            const bankRequired = await bankMultiSig.requiredConfirmations();
            
            console.log("--- Bank MultiSig ---");
            console.log("Address:", bankMultiSigAddr);
            console.log("You are signer:", isBankSigner);
            console.log("Owner:", bankOwner);
            console.log("All signers:", bankSigners);
            console.log("Required confirmations:", bankRequired.toString());
            
            // Final check
            if (!isStandardSigner && !isBankSigner) {
                console.error("❌ You are NOT a signer on either MultiSig!");
            } else {
                console.log("✅ You are authorized on at least one MultiSig");
            }
            
        } catch (error) {
            console.error("Signer status debug error:", error);
        }
    };
    
    
    // --- Form Handlers ---
        const handleRegisterAsset = async (e) => {
        e.preventDefault();
        if (!registryContract || !signer) {
            alert('Please connect your wallet first');
            return;
        }
    
        try {
            // Check if we're on the correct network before transaction
            const network = await signer.provider.getNetwork();
            if (network.chainId !== 1317n) { // Note: using BigInt
                await switchToMorpheusNetwork();
                return; // Exit and let user try again after network switch
            }
    
            const assetDetails = JSON.stringify({
                name: regAssetName,
                serial: regSerialNumber,
                category: regCategory,
                location: regLocation
            });
            const valueInWei = ethers.parseEther(regValue || "0");
            const ownerAddress = await signer.getAddress();
    
            addLog("Registering...", `Details: ${assetDetails}`);
            const tx = await registryContract.registerNewAsset(ownerAddress, assetDetails, valueInWei);
            const receipt = await tx.wait();
            
            // Better event parsing - look for Transfer event from ERC721
            let newId = "N/A";
            for (const log of receipt.logs) {
                try {
                    // Try parsing with AssetNFT interface for Transfer event
                    const assetNftAddress = await registryContract.assetNft();
                    const assetNft = new ethers.Contract(assetNftAddress, AssetNFTAbi.abi, signer);
                    const parsedLog = assetNft.interface.parseLog(log);
                    
                    if (parsedLog && parsedLog.name === "Transfer" && parsedLog.args.from === "0x0000000000000000000000000000000000000000") {
                        newId = parsedLog.args.tokenId.toString();
                        break;
                    }
                } catch (e) {
                    // Try parsing with registry interface
                    try {
                        const parsedLog = registryContract.interface.parseLog(log);
                        if (parsedLog && parsedLog.name === "AssetRegistered") {
                            newId = parsedLog.args.tokenId.toString();
                            break;
                        }
                    } catch (e2) {
                        continue;
                    }
                }
            }
            
            alert(`Asset registered successfully! New Token ID: ${newId}`);
            addLog("Success", `Asset registered with Token ID: ${newId}`);
            
            // Refresh owned tokens after registration
            if (newId !== "N/A") {
                await fetchOwnedTokens();
            }
    
            // Clear form fields after successful registration
            setRegAssetName('');
            setRegSerialNumber('');
            setRegCategory('');
            setRegLocation('');
            setRegValue('');
            
        } catch (error) {
            console.error("Error registering asset:", error);
            if (error.code === 4001) {
                alert("Transaction rejected by user");
            } else {
                alert("Error registering asset: " + error.message);
            }
            addLog("Error", "Failed to register asset: " + error.message);
        }
    };

    // Function to handle form submission for adding a lifecycle event
    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!registryContract) return;
        try {
            addLog("Adding Event...", `Adding '${eventType}' to token ${eventTokenId}`);
            const tx = await registryContract.addLifecycleEvent(eventTokenId, eventType, eventDescription);
            await tx.wait();
            alert("Lifecycle event added successfully!");
            addLog("Success", `Event added to token ${eventTokenId}`);
        } catch (error) {
            console.error("Error adding event:", error);
            alert("Error: You might not have the 'CERTIFIED_PROFESSIONAL_ROLE'.");
            addLog("Error", "Failed to add event.");
        }
    };

    // --- Handler for initiating a transfer ---
        const handleInitiateTransfer = async (e) => {
        e.preventDefault();
        if (!registryContract || !signer) return;
    
        try {
            // Validate inputs first
            if (!transferTokenId || !transferToAddress) {
                alert("Please enter both Token ID and recipient address");
                return;
            }
            
            console.log("Starting transfer process for token:", transferTokenId);
            
            // Debug the asset first
            await debugAssetTransfer(transferTokenId);
            await debugCompleteTransferFlow(transferTokenId);
            await checkContractExistence();
            await debugSignerStatus(); 
            
            // 1. Get asset data and contract addresses from AssetRegistry
            addLog("Initiating Transfer...", `Fetching data for token ${transferTokenId}`);
            
            // FIXED: Use a different variable name to avoid conflict with state
            const currentAssetData = await registryContract.assetDataStore(transferTokenId);
            console.log("Asset data retrieved:", currentAssetData);
            
            // Check if asset exists (using the new variable name)
            if (!currentAssetData || currentAssetData.length < 4 || !currentAssetData[3]) {
                throw new Error(`Asset with token ID ${transferTokenId} does not exist`);
            }
            
            const highValueThreshold = await registryContract.highValueThreshold();
            const assetNftAddress = await registryContract.assetNft();
            
            // Use the new variable name in the comparison
            if (currentAssetData[1] > highValueThreshold) {
                // HIGH VALUE - Use MultiSig process
                const multiSigWalletAddress = await registryContract.bankMultiSigWallet();
                addLog("Info", "High-value asset. Using Bank MultiSig process.");
                
                // Approve MultiSig and initiate MultiSig transfer
                const assetNft = new ethers.Contract(assetNftAddress, AssetNFTAbi.abi, signer);
                const approveTx = await assetNft.approve(multiSigWalletAddress, transferTokenId);
                await approveTx.wait();
                
                const initiateTx = await registryContract.initiateTransfer(transferTokenId, transferToAddress);
                await initiateTx.wait();
                
            } else {
                // LOW VALUE - Direct transfer (no MultiSig)
                addLog("Info", "Low-value asset. Performing direct transfer.");
                
                // Option A: Direct NFT transfer (if allowed)
                const assetNft = new ethers.Contract(assetNftAddress, AssetNFTAbi.abi, signer);
                const transferTx = await assetNft.transferFrom(
                    await signer.getAddress(), 
                    transferToAddress, 
                    transferTokenId
                );
                await transferTx.wait();
                
                // Option B: Or use a direct transfer function in your registry
                // const transferTx = await registryContract.directTransfer(transferTokenId, transferToAddress);
            }
    
            alert("Transfer completed successfully!");
            
        } catch (error) {
            console.error("Transfer failed:", error);
            alert("Transfer failed: " + error.message);
        }
    };

    

    const grantRegistrarRole = async () => {
        if (!registryContract || !signer) return;
        
        try {
            const userAddress = await signer.getAddress();
            addLog("Granting Role...", `Granting ASSET_REGISTRAR_ROLE to ${userAddress}`);
            
            // Get the role hash (this should match your contract)
            const ASSET_REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ASSET_REGISTRAR_ROLE"));
            
            const tx = await registryContract.grantRole(ASSET_REGISTRAR_ROLE, userAddress);
            await tx.wait();
            
            alert("Registrar role granted successfully!");
            addLog("Success", "ASSET_REGISTRAR_ROLE granted to your account");
        } catch (error) {
            console.error("Failed to grant role:", error);
            alert("Failed to grant role. You might not be the contract owner.");
            addLog("Error", "Failed to grant registrar role");
        }
    };

    const NavLink = ({ page, icon, text }) => (
        <li className={activePage === page ? 'active' : ''}>
            <a href={`#${page}`} className="nav-link" onClick={(e) => { e.preventDefault(); setActivePage(page); }}>
                <i className={`bx ${icon}`}></i>
                <span className="text">{text}</span>
            </a>
        </li>
    );

    const handleLogout = () => {
        setSigner(null);
        setSignerAddress("");
        setRegistryContract(null);
        setActivePage("dashboard");
        setLogs([]);
        setAssetData(null);
        setTokenId("");
        setRegAssetName("");
        setRegSerialNumber("");
        setRegCategory("");
        setRegLocation("");
        setRegValue("");
        setEventTokenId("");
        setEventType("");
        setEventDescription("");
        setTransferTokenId("");
        setTransferToAddress("");
    };

    return (
        <>
            {!signer ? (
                <LandingPage onConnect={connectWallet} />
            ) : (
                <>
                    <section id="sidebar">
                        {/* Keep your existing sidebar JSX */}
                        <div className="container">
                            <div className="site-header-inner">
                                <div className="brand header-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <h1 className="m-0">
                                        <a href="#dashboard" onClick={(e) => { e.preventDefault(); setActivePage('dashboard'); }}>
                                            <img className="header-logo-image" src="/dist/images/logo.svg" alt="Logo" />
                                        </a>
                                    </h1>
                                    <span style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ffffff' }}>AssetChain</span>
                                </div>
                            </div>
                        </div>
                        <ul className="side-menu top">
                            <NavLink page="dashboard" icon="bxs-dashboard" text="Dashboard" />
                            <NavLink page="register" icon="bxs-shopping-bag-alt" text="Register New Asset" />
                            <NavLink page="lifecycle" icon="bxs-doughnut-chart" text="Add Lifecycle Event" />
                            <NavLink page="transfer" icon="bxs-group" text="Transfer Ownership" />
                        </ul>
                        <ul className="side-menu">
                            <NavLink page="settings" icon="bxs-cog" text="Settings" />
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="nav-link"
                                    style={{
                                        background: 'none',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 0,
                                        padding: '5px 10px',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        width: '100%',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = '#222'}
                                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                                >
                                    <i className="bx bxs-log-out" style={{ fontSize: '1rem', color: '#ff4f4f' }}></i>
                                    <span className="text" style={{ color: '#ff4f4f' }}>Logout</span>
                                </button>
                            </li>
                        </ul>
                    </section>
                    <section id="content">
                        <MainContent
                            activePage={activePage}
                            signerAddress={signerAddress}
                            ownedTokens={ownedTokens}
                            loadingTokens={loadingTokens}
                            fetchOwnedTokens={fetchOwnedTokens}
                            grantRegistrarRole={grantRegistrarRole}
                            checkMyRoles={checkMyRoles}  // Add this line
                            tokenId={tokenId}
                            setTokenId={setTokenId}
                            fetchAssetData={fetchAssetData}
                            assetData={assetData}
                            setAssetData={setAssetData}
                            logs={logs}
                            regAssetName={regAssetName}
                            setRegAssetName={setRegAssetName}
                            regSerialNumber={regSerialNumber}
                            setRegSerialNumber={setRegSerialNumber}
                            regCategory={regCategory}
                            setRegCategory={setRegCategory}
                            regLocation={regLocation}
                            setRegLocation={setRegLocation}
                            regValue={regValue}
                            setRegValue={setRegValue}
                            handleRegisterAsset={handleRegisterAsset}
                            eventTokenId={eventTokenId}
                            setEventTokenId={setEventTokenId}
                            eventType={eventType}
                            setEventType={setEventType}
                            eventDescription={eventDescription}
                            setEventDescription={setEventDescription}
                            handleAddEvent={handleAddEvent}
                            transferTokenId={transferTokenId}
                            setTransferTokenId={setTransferTokenId}
                            transferToAddress={transferToAddress}
                            setTransferToAddress={setTransferToAddress}
                            handleInitiateTransfer={handleInitiateTransfer}
                        />
                    </section>
                </>
            )}
        </>
    );
}

export default App;