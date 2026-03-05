import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";

const SESSION_KEY = "dashboard_auth_v1";
const PASSWORD = "spinoscopy2026";

const G = {
  bg:        "#0a0a0a",
  border:    "rgba(34,197,94,0.4)",
  border2:   "rgba(34,197,94,0.3)",
  border3:   "rgba(34,197,94,0.5)",
  g300:      "#86efac",
  g400:      "#4ade80",
  g500:      "#22c55e",
  g600:      "#16a34a",
  red:       "#f87171",
  dimBg:     "rgba(0,0,0,0.6)",
  bodyBg:    "rgba(0,0,0,0.8)",
};

export default function DashboardWithAuth() {
  const [status, setStatus] = useState<"locked" | "unlocked">("locked");
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setStatus("unlocked");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setStatus("unlocked");
    } else {
      setError(true);
      setInput("");
    }
  };

  if (status === "unlocked") return <Dashboard />;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: G.bg, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, fontFamily: "monospace" }}>
      <div style={{ width: "100%", maxWidth: "384px", padding: "0 24px" }}>

        {/* Terminal window */}
        <div style={{ border: `1px solid ${G.border}`, borderRadius: "8px", overflow: "hidden" }}>

          {/* Title bar */}
          <div style={{ background: G.dimBg, borderBottom: `1px solid ${G.border2}`, padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.7)", display: "inline-block" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "rgba(234,179,8,0.7)", display: "inline-block" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "rgba(34,197,94,0.7)", display: "inline-block" }} />
            <span style={{ marginLeft: "8px", fontSize: "10px", color: G.g500, letterSpacing: "0.1em" }}>
              surgery-dashboard — restricted
            </span>
          </div>

          {/* Body */}
          <div style={{ background: G.bodyBg, padding: "32px 24px", display: "flex", flexDirection: "column", gap: "24px" }}>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <p style={{ color: G.g500, fontSize: "11px", letterSpacing: "0.05em" }}>~ $ access surgery-dashboard</p>
              <p style={{ color: G.g400, fontSize: "12px" }}>Authentication required.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "10px", color: G.g500, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Password
                </label>
                <div style={{ display: "flex", alignItems: "center", border: `1px solid ${G.border3}`, borderRadius: "4px", padding: "8px 12px", gap: "8px" }}>
                  <span style={{ color: G.g500, fontSize: "12px", userSelect: "none" }}>▶</span>
                  <input
                    type="password"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setError(false); }}
                    autoFocus
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    style={{ flex: 1, background: "transparent", color: G.g300, fontSize: "14px", outline: "none", border: "none" }}
                  />
                </div>
                {error && (
                  <p style={{ color: G.red, fontSize: "11px" }}>Access denied. Try again.</p>
                )}
              </div>

              <button
                type="submit"
                style={{ width: "100%", padding: "8px", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", border: `1px solid ${G.border}`, borderRadius: "4px", color: G.g400, background: "transparent", cursor: "pointer", fontFamily: "monospace" }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = "rgba(34,197,94,0.08)"; }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "transparent"; }}
              >
                Authenticate
              </button>
            </form>

            <p style={{ color: G.g600, fontSize: "10px", textAlign: "center" }}>
              W.T. Yuh, MD — internal use only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
