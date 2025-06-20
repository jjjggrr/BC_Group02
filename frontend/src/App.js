import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import contract ABI (Application Binary Interface) and address after deployment
import AssetRegistryAbi from './abi/AssetRegistry.json';
import AssetNFTAbi from './abi/AssetNFT.json';
// Make sure to replace this with the address from your local deployment
const REGISTRY_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"; 

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

    // --- Wallet Connection Handler ---
    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const web3Provider = new ethers.BrowserProvider(window.ethereum);
                // Request account access
                await web3Provider.send("eth_requestAccounts", []);
                const web3Signer = await web3Provider.getSigner();
                const address = await web3Signer.getAddress();
                
                setSigner(web3Signer);
                setSignerAddress(address);
                
                const contract = new ethers.Contract(REGISTRY_ADDRESS, AssetRegistryAbi.abi, web3Signer);
                setRegistryContract(contract);
                
                addLog("Wallet Connected", `Connected as ${address}`);
            } catch (error) {
                console.error("User rejected connection or an error occurred.", error);
                alert("Failed to connect wallet.");
            }
        } else {
            alert("Please install MetaMask to use this application!");
            console.error("Please install MetaMask!");
        }
    };

    // --- Helper to add logs to the UI ---
    const addLog = (action, details) => {
        const timestamp = new Date().toLocaleString();
        setLogs(prevLogs => [{ timestamp, action, details }, ...prevLogs]);
    };

    // ... (keep all your other functions like fetchAssetData, handleRegisterAsset, etc. here) ...
    // Function to fetch asset data
    const fetchAssetData = async () => {
        if (registryContract && tokenId) { // Ensure tokenId is not empty
            try {
                addLog("Fetching...", `Requesting data for token ID: ${tokenId}`);
                const data = await registryContract.assetDataStore(tokenId);
                setAssetData(data);
                addLog("Success", `Data received for token ID: ${tokenId}`);
            } catch (error) {
                console.error("Error fetching asset data:", error);
                setAssetData(null);
                addLog("Error", `Failed to fetch data for token ID: ${tokenId}`);
            }
        }
    };
    
    // --- Form Handlers ---
    const handleRegisterAsset = async (e) => {
        e.preventDefault();
        if (!registryContract || !signer) return;

        const assetDetails = JSON.stringify({
            name: regAssetName,
            serial: regSerialNumber,
            category: regCategory,
            location: regLocation
        });
        const valueInWei = ethers.parseEther(regValue || "0");
        const ownerAddress = await signer.getAddress();

        try {
            addLog("Registering...", `Details: ${assetDetails}`);
            const tx = await registryContract.registerNewAsset(ownerAddress, assetDetails, valueInWei);
            const receipt = await tx.wait();
            const event = receipt.logs.find(log => { try { const p = registryContract.interface.parseLog(log); return p && p.name === "AssetRegistered"; } catch (e) { return false; } });
            const newId = event ? event.args.tokenId.toString() : "N/A";
            alert(`Asset registered successfully! New Token ID: ${newId}`);
            addLog("Success", `Asset registered with Token ID: ${newId}`);
        } catch (error) {
            console.error("Registration failed:", error);
            alert("Registration failed. Check console for details.");
            addLog("Error", "Registration failed.");
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

    const renderPage = () => {
        // ... (keep your existing renderPage function here) ...
        switch (activePage) {
            case 'register':
                return (
                    <main>
                        <h1>Register New Asset</h1>
                        <form onSubmit={handleRegisterAsset}>
                            <input type="text" placeholder="Asset Name" value={regAssetName} onChange={e => setRegAssetName(e.target.value)} required />
                            <input type="text" placeholder="Serial Number" value={regSerialNumber} onChange={e => setRegSerialNumber(e.target.value)} />
                            <input type="text" placeholder="Category" value={regCategory} onChange={e => setRegCategory(e.target.value)} />
                            <input type="text" placeholder="Location" value={regLocation} onChange={e => setRegLocation(e.target.value)} />
                            <input type="text" placeholder="Asset Value (in ETH)" value={regValue} onChange={e => setRegValue(e.target.value)} required />
                            <button type="submit" className="button">Register</button>
                        </form>
                    </main>
                );
            case 'lifecycle':
                return (
                    <main>
                        <h1>Add Lifecycle Event</h1>
                        <form onSubmit={handleAddEvent}>
                            <input type="text" placeholder="Asset ID" value={eventTokenId} onChange={e => setEventTokenId(e.target.value)} required />
                            <input type="text" placeholder="Event Type (e.g., Repair)" value={eventType} onChange={e => setEventType(e.target.value)} required />
                            <input type="text" placeholder="Notes / Description" value={eventDescription} onChange={e => setEventDescription(e.target.value)} required />
                            <button type="submit" className="button">Add Event</button>
                        </form>
                    </main>
                );
            case 'transfer':
                return (
                    <main>
                        <h1>Transfer Ownership</h1>
                        <form onSubmit={handleInitiateTransfer}>
                            <input type="text" placeholder="Asset ID to Transfer" value={transferTokenId} onChange={e => setTransferTokenId(e.target.value)} required />
                            <input type="text" placeholder="Recipient Address" value={transferToAddress} onChange={e => setTransferToAddress(e.target.value)} required />
                            <button type="submit" className="button">Initiate Transfer</button>
                        </form>
                    </main>
                );
            case 'settings':
                 return <main><h1>Settings</h1><p>Application preferences can be adjusted here.</p></main>;
            case 'dashboard':
            default:
                return (
                    <main>
                        <div className="head-title"><div className="left"><h1>Dashboard</h1></div></div>
                        
                        <div className="data-fetch-box">
                            <h3>View Asset Data by ID</h3>
                            <form onSubmit={(e) => { e.preventDefault(); fetchAssetData(); }}>
                                <input 
                                    type="text" 
                                    placeholder="Enter Token ID" 
                                    value={tokenId} 
                                    onChange={e => setTokenId(e.target.value)} 
                                />
                                <button type="submit" className="button">Fetch Data</button>
                            </form>
                            {assetData && (
                                <div className="asset-data-display">
                                    <h4>Details for Token ID: {tokenId}</h4>
                                    <pre>{JSON.stringify({
                                        assetDetails: assetData.assetDetails,
                                        value: ethers.formatEther(assetData.value) + ' ETH',
                                        lifecycleHistoryCount: assetData.lifecycleHistory.length
                                    }, null, 2)}</pre>
                                </div>
                            )}
                        </div>

                        <div className="log-box">
                            <h3>Recent Logs</h3>
                            <table className="log-table">
                                <thead><tr><th>Timestamp</th><th>Action</th><th>Details</th></tr></thead>
                                <tbody>
                                    {logs.map((log, index) => (
                                        <tr key={index}>
                                            <td>{log.timestamp}</td>
                                            <td>{log.action}</td>
                                            <td>{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </main>
                );
        }
    };

    const NavLink = ({ page, icon, text }) => (
        // ... (keep your existing NavLink component here) ...
        <li className={activePage === page ? 'active' : ''}>
            <a href={`#${page}`} className="nav-link" onClick={(e) => { e.preventDefault(); setActivePage(page); }}>
                <i className={`bx ${icon}`}></i>
                <span className="text">{text}</span>
            </a>
        </li>
    );

    return (
        <>
            <section id="sidebar">
                {/* ... (keep your existing sidebar JSX here) ... */}
                <div className="container">
                    <div className="site-header-inner">
                        <div className="brand header-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h1 className="m-0">
                                <a href="#dashboard" onClick={(e) => { e.preventDefault(); setActivePage('dashboard'); }}>
                                    <img className="header-logo-image" src="/dist/images/logo.svg" alt="Logo" />
                                </a>
                            </h1>
                            <span style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ffffff' }}>G2</span>
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
                </ul>
            </section>

            <section id="content">
                {/* Conditionally render based on wallet connection */}
                {!signer ? (
                    <div className="wallet-connect-container">
                        <h1>Welcome to the G2 Asset Registry</h1>
                        <p>Please connect your wallet to continue.</p>
                        <button className="button" onClick={connectWallet}>Connect Wallet</button>
                    </div>
                ) : (
                    renderPage()
                )}
            </section>
        </>
    );
}

export default App;