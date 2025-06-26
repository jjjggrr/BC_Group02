import React from "react";

export default function LandingPage({ onConnect }) {
  return (
    <div className="body-wrap" style={{ minHeight: "100vh", background: "#181c24" }}>
      <header className="site-header">
        <div className="container">
          <div className="site-header-inner">
            <div className="brand header-brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 className="m-0">
                <a href="#">
                  <img className="header-logo-image" src="/dist/images/logo.svg" alt="Logo" />
                </a>
              </h1>
              <span style={{ fontSize: "1.5rem", fontWeight: 600, color: "#ffffff" }}>AssetChain</span>
            </div>
          </div>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-inner" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", padding: "60px 0" }}>
              <div className="hero-copy" style={{ maxWidth: 500 }}>
                <h1 className="hero-title mt-0" style={{ color: "#fff", fontSize: "2.6rem", fontWeight: 700, marginBottom: 18 }}>Revolutionizing Asset Ownership</h1>
                <p className="hero-paragraph" style={{ color: "#b0b8c9", fontSize: "1.2rem", marginBottom: 32 }}>
                  AssetChain presents a blockchain-powered registry for secure, transparent, and efficient management of high-value assets. Experience a new era of ownership with NFTs and smart contracts.
                </p>
                <div className="hero-cta">
                  <button
                    className="button button-primary"
                    style={{
                      background: "linear-gradient(90deg, #4f8cff 0%, #3358e4 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "17px 32px",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(79, 140, 255, 0.15)",
                      transition: "background 0.2s, box-shadow 0.2s"
                    }}
                    onClick={onConnect}
                    onMouseOver={e => e.currentTarget.style.background = "linear-gradient(90deg, #3358e4 0%, #4f8cff 100%)"}
                    onMouseOut={e => e.currentTarget.style.background = "linear-gradient(90deg, #4f8cff 0%, #3358e4 100%)"}
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
              <div className="hero-figure anime-element" style={{ flex: 1, textAlign: "center" }}>
                <img src="/dist/images/main-icon.svg" alt="Hero illustration" width="340" height="255" style={{ maxWidth: "100%" }} />
              </div>
            </div>
          </div>
        </section>
      </main>
<footer className="site-footer">
  <div className="container">
    <div
      className="site-footer-inner"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between", // ← spreads left and right content
        minHeight: 60,
        flexWrap: "nowrap", // prevent wrapping
      }}
    >
      <div
        className="footer-copyright"
        style={{
          color: "#b0b8c9",
          fontSize: "0.8rem",
          whiteSpace: "nowrap",
        }}
      >
        &copy; 2025 AssetChain, all rights reserved
      </div>
      <ul
        className="footer-links list-reset"
        style={{
          display: "flex",
          gap: 24,
          listStyle: "none",
          padding: 0,
          margin: 0,
        }}
      >
        <li><a href="#" style={{ color: "#b0b8c9" }}>Contact</a></li>
        <li><a href="#" style={{ color: "#b0b8c9" }}>About us</a></li>
        <li><a href="#" style={{ color: "#b0b8c9" }}>FAQ's</a></li>
        <li><a href="#" style={{ color: "#b0b8c9" }}>Support</a></li>
      </ul>
    </div>
  </div>
</footer>

    </div>
  );
}
