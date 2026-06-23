import "./clarion-features.css";

export default function ClarionFeatures() {
  return (
    <div className="pf-shell">
      <div className="pf-container">
        <div className="pf-badge">How Clarion works</div>
        <h2 className="pf-title">From a spoken role to a fair verdict</h2>
        <p className="pf-subtitle">
          Author by voice. Interview by AI.
          <br />
          Decide with the evidence.
        </p>

        <div className="pf-grid">
          {/* Card 1 — Author by voice */}
          <div className="pf-card pf-card-1">
            <div className="pf-prompt">
              I need a support rep who{" "}
              <span className="pf-hl">stays calm with angry customers</span>,{" "}
              <span className="pf-hl">takes ownership</span> of problems, and{" "}
              <span className="pf-hl">communicates clearly</span>.
            </div>
            <div className="pf-pill">
              <span className="pf-dot" />
              Recording…
            </div>
            <h3>Author by voice</h3>
            <p className="pf-sub">
              Describe the role out loud — Clarion drafts the rubric and questions in
              seconds.
            </p>
          </div>

          {/* Card 2 — Live AI interview */}
          <div className="pf-card pf-card-2">
            <div className="pf-orb" />
            <div className="pf-caption">&ldquo;How am I being judged?&rdquo;</div>
            <h3>Live AI interview</h3>
            <p className="pf-sub">
              The same fair conversation for everyone — adaptive follow-ups, and it
              answers candidates honestly.
            </p>
          </div>

          {/* Card 3 — Glass-box verdict */}
          <div className="pf-card pf-card-3">
            <div className="pf-mesh" />
            <div className="pf-verdict">
              <div className="pf-vrow">
                <span className="pf-vname">Customer empathy</span>
                <span className="pf-vscore">5 / 5</span>
              </div>
              <div className="pf-quote">
                &ldquo;I told her I completely understood why she was frustrated, and
                I&apos;d stay on the line until it was sorted.&rdquo;
              </div>
            </div>
            <h3>Glass-box verdict</h3>
            <p className="pf-sub">
              Every score links to the exact transcript quote. You make the final call.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
