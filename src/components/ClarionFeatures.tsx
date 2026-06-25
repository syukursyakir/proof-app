import "./clarion-features.css";
import { useSiteLocale } from "@/components/SiteLocaleProvider";

export default function ClarionFeatures() {
  const { dict } = useSiteLocale();
  const f = dict.employer.features;
  return (
    <div className="pf-shell">
      <div className="pf-container">
        <div className="pf-badge">{f.badge}</div>
        <h2 className="pf-title">{f.title}</h2>
        <p className="pf-subtitle">
          {f.subtitleLine1}
          <br />
          {f.subtitleLine2}
        </p>

        <div className="pf-grid">
          {/* Card 1 — Author by voice */}
          <div className="pf-card pf-card-1">
            <div className="pf-prompt">
              {f.card1Prompt
                .split(/(\{calm\}|\{ownership\}|\{clear\})/)
                .map((part, i) =>
                  part === "{calm}" ? (
                    <span key={i} className="pf-hl">{f.card1PromptCalm}</span>
                  ) : part === "{ownership}" ? (
                    <span key={i} className="pf-hl">{f.card1PromptOwnership}</span>
                  ) : part === "{clear}" ? (
                    <span key={i} className="pf-hl">{f.card1PromptClear}</span>
                  ) : (
                    part
                  ),
                )}
            </div>
            <div className="pf-pill">
              <span className="pf-dot" />
              {f.card1Recording}
            </div>
            <h3>{f.card1Title}</h3>
            <p className="pf-sub">{f.card1Body}</p>
          </div>

          {/* Card 2 — Live AI interview */}
          <div className="pf-card pf-card-2">
            <div className="pf-orb" />
            <div className="pf-caption">{f.card2Caption}</div>
            <h3>{f.card2Title}</h3>
            <p className="pf-sub">{f.card2Body}</p>
          </div>

          {/* Card 3 — Glass-box verdict */}
          <div className="pf-card pf-card-3">
            <div className="pf-mesh" />
            <div className="pf-verdict">
              <div className="pf-vrow">
                <span className="pf-vname">{f.card3Criterion}</span>
                <span className="pf-vscore">{f.card3Score}</span>
              </div>
              <div className="pf-quote">{f.card3Quote}</div>
            </div>
            <h3>{f.card3Title}</h3>
            <p className="pf-sub">{f.card3Body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
