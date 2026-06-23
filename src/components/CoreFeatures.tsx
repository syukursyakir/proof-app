import "./core-features.css";

export default function CoreFeatures() {
  return (
    <div className="c1-shell">
      <div className="c1-container">
        <div className="c1-badge">Core Features</div>
        <h2 className="c1-title">Built for Speed &amp; Quality</h2>
        <p className="c1-subtitle">
          Everything you need to go
          <br />
          from idea to image
        </p>

        <div className="c1-grid">
          {/* Card 1 — Smart Prompt Suggestions */}
          <div className="c1-card c1-card-1">
            <div className="c1-prompt">
              A bright, high-resolution 3D illustration of a{" "}
              <span className="c1-blur-text">cheerful cartoon</span> of a{" "}
              <span className="c1-blur-text">girl character</span>{" "}
              <span className="c1-blur-text">centred against a</span> smooth blue
              background
            </div>
            <button className="c1-pill">
              <span className="c1-star">✦</span>Add more details
            </button>
            <svg className="c1-cursor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 2L20 11L11 13L9 22L4 2Z" />
            </svg>
            <h3>Smart Prompt Suggestions</h3>
          </div>

          {/* Card 2 — API Access */}
          <div className="c1-card c1-card-2">
            <div className="c1-api-visual">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="c1-network-img"
                src="https://pub-f170a2592d2c4a1485466404c36807be.r2.dev/viktor/network.svg"
                alt="Network diagram"
              />
            </div>
            <h3>API Access</h3>
          </div>

          {/* Card 3 — Project Library */}
          <div className="c1-card c1-card-3">
            <div className="c1-mesh" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="c1-folder"
              src="https://pub-f170a2592d2c4a1485466404c36807be.r2.dev/viktor/library%20icon.svg"
              alt="Library folder"
            />
            <div className="c1-search">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search in library
            </div>
            <h3>Project Library</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
