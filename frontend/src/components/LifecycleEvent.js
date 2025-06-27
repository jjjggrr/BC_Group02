const LifecycleEvent = ({
    eventTokenId,
    setEventTokenId,
    eventType,
    setEventType,
    eventDescription,
    setEventDescription,
    handleAddEvent
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
            <h1 style={{ fontSize: '2.4rem', color: '#fff', fontWeight: 700 }}>Add Lifecycle Event</h1>
            <form onSubmit={handleAddEvent}>
                <input 
                    type="text" 
                    placeholder="Token ID" 
                    value={eventTokenId} 
                    onChange={e => setEventTokenId(e.target.value)} 
                    required
                    style={inputStyle}
                />
                <select 
                    value={eventType} 
                    onChange={e => setEventType(e.target.value)} 
                    required
                    style={{...inputStyle, appearance: 'none'}}
                >
                    <option value="">Select Event Type</option>
                    <option value="Repair">Repair</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Damage Report">Damage Report</option>
                    <option value="Modification">Modification</option>
                    <option value="Other">Other</option>
                </select>
                <textarea 
                    placeholder="Event Description" 
                    value={eventDescription} 
                    onChange={e => setEventDescription(e.target.value)} 
                    required
                    rows="4"
                    style={{...inputStyle, marginBottom: '18px', resize: 'vertical'}}
                />
                <button 
                    type="submit" 
                    className="button" 
                    style={buttonStyle}
                    onMouseOver={e => e.currentTarget.style.background = "linear-gradient(90deg, #3358e4 0%, #4f8cff 100%)"}
                    onMouseOut={e => e.currentTarget.style.background = "linear-gradient(90deg, #4f8cff 0%, #3358e4 100%)"}
                >
                    Add Event
                </button>
            </form>
        </main>
    );
};

export default LifecycleEvent;