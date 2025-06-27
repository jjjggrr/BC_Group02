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

        // Add this function after fetchAssetData and before handleRegisterAsset
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
                    // Get token ID at index i
                    const tokenId = await assetNft.tokenOfOwnerByIndex(address, i);
                    
                    // Get registry data for this token
                    let registryData = null;
                    let parsedDetails = {};
                    let value = "0";
                    let lifecycleHistory = [];
                    
                    try {
                        registryData = await registryContract.assetDataStore(tokenId);
                        
                        // Parse asset details JSON
                        if (registryData.assetDetails) {
                            try {
                                parsedDetails = JSON.parse(registryData.assetDetails);
                            } catch (e) {
                                parsedDetails = { name: registryData.assetDetails };
                            }
                        }
                        
                        value = registryData.value || "0";
                        lifecycleHistory = registryData.lifecycleHistory || [];
                        
                    } catch (e) {
                        console.log(`No registry data for token ${tokenId}`);
                        parsedDetails = { name: 'Unknown Asset' };
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
    
    // Function to fetch asset data by token ID
    const fetchAssetData = async () => {
        if (registryContract && tokenId) {
            try {
                addLog("Fetching...", `Requesting data for token ID: ${tokenId}`);
                
                // Get AssetNFT contract
                const assetNftAddress = await registryContract.assetNft();
                const assetNft = new ethers.Contract(
                    assetNftAddress, 
                    contractsData.AssetNFT.abi, 
                    signer
                );
                
                // Check if token exists by getting its owner
                let owner;
                try {
                    owner = await assetNft.ownerOf(tokenId);
                } catch (e) {
                    setAssetData(null);
                    addLog("Error", `Token ID ${tokenId} does not exist`);
                    alert(`Token ID ${tokenId} does not exist`);
                    return;
                }
                
                // Get registry data (optional)
                let registryData = null;
                try {
                    registryData = await registryContract.assetDataStore(tokenId);
                } catch (e) {
                    console.log("No registry data available");
                }
                
                // Create asset data object
                const assetDataObj = {
                    tokenId: tokenId,
                    owner: owner,
                    assetDetails: registryData ? registryData.assetDetails : "No details available",
                    value: registryData ? registryData.value : "0",
                    lifecycleHistory: registryData ? registryData.lifecycleHistory : [],
                    exists: true // We know it exists because ownerOf worked
                };
                
                setAssetData(assetDataObj);
                addLog("Success", `Found token ${tokenId}, owner: ${owner}`);
                
            } catch (error) {
                console.error("Error fetching asset data:", error);
                setAssetData(null);
                addLog("Error", "Failed to fetch asset: " + error.message);
            }
        }
    };
    
    // Add this line to your existing fetchOwnedTokens function to parse the asset details:
    
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
            // 1. Get asset data and contract addresses from AssetRegistry
            addLog("Initiating Transfer...", `Fetching data for token ${transferTokenId}`);
            const assetData = await registryContract.assetDataStore(transferTokenId);
            const highValueThreshold = await registryContract.highValueThreshold();
            const assetNftAddress = await registryContract.assetNft();

            // 2. Determine which MultiSigWallet to use
            let multiSigWalletAddress;
            if (assetData.value > highValueThreshold) {
                multiSigWalletAddress = await registryContract.bankMultiSigWallet();
                addLog("Info", "High-value asset. Using Bank MultiSig.");
            } else {
                multiSigWalletAddress = await registryContract.standardMultiSigWallet();
                addLog("Info", "Low-value asset. Using Standard MultiSig.");
            }

            // 3. Approve the MultiSigWallet to manage the NFT
            const assetNft = new ethers.Contract(assetNftAddress, AssetNFTAbi.abi, signer);
            addLog("Approval", `Approving MultiSig wallet for token ${transferTokenId}. Please confirm in MetaMask.`);
            const approveTx = await assetNft.approve(multiSigWalletAddress, transferTokenId);
            await approveTx.wait();
            addLog("Success", "Approval successful!");

            // 4. Initiate the transfer via AssetRegistry
            addLog("Initiating", `Calling initiateTransfer for ${transferToAddress}. Please confirm in MetaMask.`);
            const initiateTx = await registryContract.initiateTransfer(transferTokenId, transferToAddress);
            await initiateTx.wait();
            alert("Transfer initiated successfully! It now requires confirmations from other signers.");
            addLog("Success", `Transfer for token ${transferTokenId} initiated.`);

        } catch (error) {
            console.error("Transfer initiation failed:", error);
            alert("Transfer initiation failed. See console for details.");
            addLog("Error", "Transfer initiation failed.");
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