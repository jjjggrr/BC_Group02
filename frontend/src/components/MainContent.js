import { ethers } from 'ethers';
import Dashboard from './Dashboard';
import RegisterAsset from './RegisterAsset';
import LifecycleEvent from './LifecycleEvent';
import TransferOwnership from './TransferOwnership';
import Settings from './Settings';

const MainContent = ({ 
    activePage, 
    signerAddress,
    ownedTokens,
    loadingTokens,
    fetchOwnedTokens,
    grantRegistrarRole,
    tokenId,
    setTokenId,
    fetchAssetData,
    assetData,
    setAssetData,
    logs,
    // Register Asset props
    regAssetName,
    setRegAssetName,
    regSerialNumber,
    setRegSerialNumber,
    regCategory,
    setRegCategory,
    regLocation,
    setRegLocation,
    regValue,
    setRegValue,
    handleRegisterAsset,
    // Lifecycle Event props
    eventTokenId,
    setEventTokenId,
    eventType,
    setEventType,
    eventDescription,
    setEventDescription,
    handleAddEvent,
    // Transfer props
    transferTokenId,
    setTransferTokenId,
    transferToAddress,
    setTransferToAddress,
    handleInitiateTransfer
}) => {
    switch (activePage) {
        case 'register':
            return (
                <RegisterAsset
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
                />
            );
        case 'lifecycle':
            return (
                <LifecycleEvent
                    eventTokenId={eventTokenId}
                    setEventTokenId={setEventTokenId}
                    eventType={eventType}
                    setEventType={setEventType}
                    eventDescription={eventDescription}
                    setEventDescription={setEventDescription}
                    handleAddEvent={handleAddEvent}
                />
            );
        case 'transfer':
            return (
                <TransferOwnership
                    transferTokenId={transferTokenId}
                    setTransferTokenId={setTransferTokenId}
                    transferToAddress={transferToAddress}
                    setTransferToAddress={setTransferToAddress}
                    handleInitiateTransfer={handleInitiateTransfer}
                />
            );
        case 'settings':
            return <Settings />;
        case 'dashboard':
        default:
            return (
                <Dashboard
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
                />
            );
    }
};

export default MainContent;