import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import contract ABI (Application Binary Interface) and address after deployment
import AssetRegistryAbi from './abi/AssetRegistry.json';
const REGISTRY_ADDRESS = "YOUR_DEPLOYED_ASSET_REGISTRY_CONTRACT_ADDRESS";

function App() {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [registryContract, setRegistryContract] = useState(null);
    const [assetData, setAssetData] = useState(null);
    const [tokenId, setTokenId] = useState("0");

    // Connect to wallet on component mount
    useEffect(() => {
        const connectWallet = async () => {
            if (window.ethereum) {
                const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(web3Provider);
                
                const web3Signer = web3Provider.getSigner();
                setSigner(web3Signer);
                
                const contract = new ethers.Contract(REGISTRY_ADDRESS, AssetRegistryAbi.abi, web3Signer);
                setRegistryContract(contract);
            } else {
                console.error("Please install MetaMask!");
            }
        };
        connectWallet();
    }, []);

    // Function to fetch asset data
    const fetchAssetData = async () => {
        if (registryContract) {
            const data = await registryContract.assetDataStore(tokenId);
            // Fetch lifecycle events as well
            const history = await Promise.all(
                // This is a simplification; you'd likely fetch events one by one or via emitted events
                 Array.from({ length: data.lifecycleHistory.length }, (_, i) => registryContract.assetDataStore(tokenId).lifecycleHistory(i))
            );
            setAssetData({ ...data, history });
        }
    };
    
    // Function to handle form submission for adding a lifecycle event
    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!registryContract) return;

        const eventType = e.target.eventType.value;
        const description = e.target.description.value;

        try {
            const tx = await registryContract.addLifecycleEvent(tokenId, eventType, description);
            await tx.wait(); // Wait for transaction to be mined
            alert("Lifecycle event added successfully!");
            fetchAssetData(); // Refresh data
        } catch (error) {
            console.error("Error adding event:", error);
            alert("Error: You might not have the 'CERTIFIED_PROFESSIONAL_ROLE'.");
        }
    };

    return (
        <div className="App">
            <h1>National Asset Registry</h1>
            <div>
                <input type="text" value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="Enter Asset Token ID" />
                <button onClick={fetchAssetData}>Fetch Asset Data</button>
            </div>

            {assetData && (
                <div>
                    <h2>Asset #{tokenId}</h2>
                    <p><strong>Details:</strong> {assetData.assetDetails}</p>
                    <h3>Lifecycle History:</h3>
                    <ul>
                        {/* Render history items here */}
                    </ul>
                </div>
            )}
            
            <hr/>

            <h2>Add Lifecycle Event (For Certified Professionals)</h2>
            <form onSubmit={handleAddEvent}>
                <input name="eventType" type="text" placeholder="Event Type (e.g., Repair)" required />
                <textarea name="description" placeholder="Description of event" required />
                <button type="submit">Add Event</button>
            </form>
        </div>
    );
}

export default App;