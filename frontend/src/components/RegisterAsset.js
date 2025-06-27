const RegisterAsset = ({
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
    handleRegisterAsset
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
            <h1 style={{ fontSize: '2.4rem', color: '#fff', fontWeight: 700 }}>Register New Asset</h1>
            <form onSubmit={handleRegisterAsset}>
                <input 
                    type="text" 
                    placeholder="Asset Name" 
                    value={regAssetName} 
                    onChange={e => setRegAssetName(e.target.value)} 
                    required
                    style={inputStyle}
                />
                <input 
                    type="text" 
                    placeholder="Serial Number" 
                    value={regSerialNumber} 
                    onChange={e => setRegSerialNumber(e.target.value)} 
                    style={inputStyle}
                />
                <input 
                    type="text" 
                    placeholder="Category" 
                    value={regCategory} 
                    onChange={e => setRegCategory(e.target.value)} 
                    style={inputStyle}
                />
                <input 
                    type="text" 
                    placeholder="Location" 
                    value={regLocation} 
                    onChange={e => setRegLocation(e.target.value)} 
                    style={inputStyle}
                />
                <input 
                    type="text" 
                    placeholder="Asset Value (in ETH)" 
                    value={regValue} 
                    onChange={e => setRegValue(e.target.value)} 
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
                    Register
                </button>
            </form>
        </main>
    );
};

export default RegisterAsset;