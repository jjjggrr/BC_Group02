const TransferOwnership = ({
    transferTokenId,
    setTransferTokenId,
    transferToAddress,
    setTransferToAddress,
    handleInitiateTransfer
}) => {
    const inputStyle = {
        background: '#222',
        color: 'white',
        border: '1.5px solid #3a3a3a',
        borderRadius: '7px',
        padding: '10px 14px',
        marginBottom: '12px',
        fontSize: '1rem',
        outline: 'none',
        display: 'block',
        width: '100%'
    };

    const buttonStyle = {
        background: "linear-gradient(90deg, #4f8cff 0%, #3358e4 100%)",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontSize: "1rem",
        fontWeight: 600,
        marginTop: "0px",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(79, 140, 255, 0.15)",
        transition: "background 0.2s, box-shadow 0.2s",
    };

    return (
        <main>
            <h1 style={{ fontSize: '2.4rem', color: '#fff', fontWeight: 700 }}>Transfer Ownership</h1>
            <p style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '20px' }}>
                Initiate a transfer of asset ownership through MultiSig wallet
            </p>
            <form onSubmit={handleInitiateTransfer}>
                <input 
                    type="text" 
                    placeholder="Token ID to Transfer" 
                    value={transferTokenId} 
                    onChange={e => setTransferTokenId(e.target.value)} 
                    required
                    style={inputStyle}
                />
                <input 
                    type="text" 
                    placeholder="Recipient Address (0x...)" 
                    value={transferToAddress} 
                    onChange={e => setTransferToAddress(e.target.value)} 
                    required
                    style={{...inputStyle, marginBottom: '18px'}}
                />
                <button 
                    type="submit" 
                    className="button" 
                    style={buttonStyle}
                    onMouseOver={e => e.currentTarget.style.background = "linear-gradient(90deg, #3358e4 0%, #4f8cff 100%)"}
                    onMouseOut={e => e.currentTarget.style.background = "linear-gradient(90deg, #4f8cff 0%, #3358e4 100%)"}
                >
                    Initiate Transfer
                </button>
            </form>
        </main>
    );
};

export default TransferOwnership;