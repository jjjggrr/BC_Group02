import { ethers } from 'ethers';

const Dashboard = ({ 
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
    logs
}) => {
    return (
        <main>
            <div className="head-title">
                <div className="left">
                    <h1 style={{ fontSize: '2.4rem', color: '#fff', fontWeight: 700 }}>Dashboard</h1>
                    <p style={{ color: '#ccc', fontSize: '1.1rem' }}>Connected as: {signerAddress}</p>
                </div>
            </div>
            
            {/* My Assets Section */}
            <div className="owned-tokens-section" style={{
                background: '#262626',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(44, 62, 80, 0.08)',
                padding: '28px 32px',
                marginTop: '24px',
                marginBottom: '32px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.35rem',
                        letterSpacing: '0.5px',
                        margin: 0,
                    }}>My Assets ({ownedTokens.length})</h3>
                    <button 
                        onClick={fetchOwnedTokens}
                        disabled={loadingTokens}
                        style={{
                            background: "linear-gradient(90deg, #4f8cff 0%, #3358e4 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 16px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            cursor: loadingTokens ? "not-allowed" : "pointer",
                            opacity: loadingTokens ? 0.6 : 1
                        }}
                    >
                        {loadingTokens ? "Loading..." : "Refresh"}
                    </button>
                </div>

                <div className="role-management-box" style={{
                    background: '#262626',
                    borderRadius: '12px',
                    boxShadow: '0 2px 12px rgba(44, 62, 80, 0.08)',
                    padding: '20px 24px',
                    marginBottom: '32px',
                }}>
                    <h3 style={{
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        letterSpacing: '0.5px',
                        marginBottom: '10px',
                    }}>Account Permissions</h3>
                    <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '15px' }}>
                        If you can't register assets, you might need to grant yourself the required roles.
                    </p>
                    <button 
                        onClick={grantRegistrarRole}
                        style={{
                            background: "linear-gradient(90deg, #ff6b35 0%, #f7931e 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 16px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        Grant Registrar Role to My Account
                    </button>
                </div>
                
                {loadingTokens ? (
                    <p style={{ color: '#ccc', textAlign: 'center', padding: '20px' }}>Loading your assets...</p>
                ) : ownedTokens.length === 0 ? (
                    <p style={{ color: '#ccc', textAlign: 'center', padding: '20px' }}>No assets found. Register your first asset to get started!</p>
                ) : (
                    <div className="tokens-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px'
                    }}>
                        {ownedTokens.map((token) => (
                            <div key={token.tokenId} style={{
                                background: '#333',
                                borderRadius: '10px',
                                border: '1.5px solid #3a3a3a',
                                padding: '20px',
                                color: 'white'
                            }}>
                                <h4 style={{
                                    color: '#4f8cff',
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    marginBottom: '10px',
                                }}>Token ID: {token.tokenId}</h4>
                                <div style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
                                    <p><strong>Name:</strong> {token.parsedDetails?.name || 'N/A'}</p>
                                    <p><strong>Category:</strong> {token.parsedDetails?.category || 'N/A'}</p>
                                    <p><strong>Location:</strong> {token.parsedDetails?.location || 'N/A'}</p>
                                    <p><strong>Serial:</strong> {token.parsedDetails?.serial || 'N/A'}</p>
                                    <p><strong>Value:</strong> {token.value ? ethers.formatEther(token.value) + ' ETH' : '0 ETH'}</p>
                                    <p><strong>Events:</strong> {token.lifecycleHistory ? token.lifecycleHistory.length : 0}</p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setTokenId(token.tokenId);
                                        setAssetData(token);
                                    }}
                                    style={{
                                        background: "transparent",
                                        color: "#4f8cff",
                                        border: "1px solid #4f8cff",
                                        borderRadius: "6px",
                                        padding: "6px 12px",
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        marginTop: "10px"
                                    }}
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Fetch by ID section */}
            <div className="data-fetch-box" style={{
                background: '#262626',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(44, 62, 80, 0.08)',
                padding: '20px 24px',
                marginBottom: '32px',
            }}>
                <h3 style={{
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    letterSpacing: '0.5px',
                    marginBottom: '10px',
                }}>View Asset Data by ID</h3>
                <form onSubmit={(e) => { e.preventDefault(); fetchAssetData(); }}>
                    <input 
                        type="text" 
                        placeholder="Enter Token ID" 
                        value={tokenId} 
                        onChange={e => setTokenId(e.target.value)} 
                        style={{
                            background: '#222',
                            color: 'white',
                            border: '1.5px solid #3a3a3a',
                            borderRadius: '7px',
                            padding: '10px 14px',
                            marginRight: '10px',
                            fontSize: '1rem',
                            outline: 'none',
                        }}
                    />
                    <button 
                        type="submit" 
                        className="button"
                        style={{
                            background: "linear-gradient(90deg, #4f8cff 0%, #3358e4 100%)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "1rem",
                            fontWeight: 600,
                            marginTop: "0px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(79, 140, 255, 0.15)",
                            transition: "background 0.2s, box-shadow 0.2s"
                        }}
                        onMouseOver={e => e.currentTarget.style.background = "linear-gradient(90deg, #3358e4 0%, #4f8cff 100%)"}
                        onMouseOut={e => e.currentTarget.style.background = "linear-gradient(90deg, #4f8cff 0%, #3358e4 100%)"}
                    >
                        Fetch Data
                    </button>
                </form>
                {assetData && (
                    <div className="asset-data-display" style={{
                        background: '#262626',
                        backgroundColor: '#262626',
                        borderRadius: '10px',
                        border: '1.5px solid #3a3a3a',
                        padding: '22px 26px',
                        marginTop: '18px',
                        marginBottom: '18px',
                        color: 'white',
                        boxShadow: '0 1px 6px rgba(44, 62, 80, 0.10)'
                    }}>
                        <h4 style={{
                            color: '#4f8cff',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            marginBottom: '10px',
                        }}>Details for Token ID: {tokenId}</h4>
                        <pre style={{
                            background: 'transparent',
                            color: 'white',
                            fontSize: '1.05rem',
                            margin: 0,
                            padding: 0,
                            fontFamily: 'monospace',
                        }}>{JSON.stringify({
                            assetDetails: assetData.assetDetails,
                            value: assetData.value ? ethers.formatEther(assetData.value) + ' ETH' : '0 ETH',
                            lifecycleHistoryCount: assetData.lifecycleHistory ? assetData.lifecycleHistory.length : 0
                        }, null, 2)}</pre>
                    </div>
                )}
            </div>

            {/* Logs section */}
            <div className="log-box" style={{
                background: '#262626',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0, 128, 255, 0.08)',
                padding: '28px 32px',
                marginTop: '36px',
                marginBottom: '32px',
                overflowX: 'auto',
            }}>
                <h3 style={{
                    color: '#3358e4',
                    fontWeight: 700,
                    fontSize: '1.35rem',
                    marginBottom: '18px',
                    letterSpacing: '0.5px',
                    color: 'white',
                }}>Recent Logs</h3>
                <table className="log-table" style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    fontSize: '1.05rem',
                    background: '#f8faff',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(44, 62, 80, 0.04)'
                }}>
                    <thead>
                        <tr style={{ background: '#222' }}>
                            <th style={{ padding: '12px 18px', color: 'white', fontWeight: 700, textAlign: 'left', borderBottom: '2px solid #e0e7ef' }}>Timestamp</th>
                            <th style={{ padding: '12px 18px', color: 'white', fontWeight: 700, textAlign: 'left', borderBottom: '2px solid #e0e7ef' }}>Action</th>
                            <th style={{ padding: '12px 18px', color: 'white', fontWeight: 700, textAlign: 'left', borderBottom: '2px solid #e0e7ef' }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', color: '#888', padding: '22px 0' }}>No logs yet.</td>
                            </tr>
                        ) : (
                            logs.map((log, index) => (
                                <tr key={index} style={{ background: index % 2 === 0 ? '#222' : '#222' }}>
                                    <td style={{ padding: '10px 18px', color: 'white', fontFamily: 'monospace', fontSize: '0.98rem', whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                                    <td style={{ padding: '10px 18px', fontWeight: 600, color: 'white' }}>{log.action}</td>
                                    <td style={{ padding: '10px 18px', color: 'white', wordBreak: 'break-word', maxWidth: '420px' }}>{log.details}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
};

export default Dashboard;