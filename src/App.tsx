import { useCallback, useEffect, useState } from "react";
import { fetchLeaderboard, fetchTheme } from "./api";
import { formatTimeMs } from "./utils";
import type { SimDay, SimEntry } from "./types";

const POLL_MS = 10_000;

function dayLabel(d: SimDay) {
  return d === "saturday" ? "Sa" : "So";
}

/* ── theme tokens ─────────────────────────────────────────────────────── */
function tokens(dark: boolean) {
  return dark ? {
    pageBg:    "#07111f",
    heroGrad:  "linear-gradient(160deg, #0f2040 0%, #07111f 60%)",
    cardBg:    "rgba(255,255,255,.04)",
    cardBdr:   "rgba(36,85,164,.4)",
    textHero:  "#f0f6ff",
    textName:  "#ddeeff",
    textTime:  "#ffffff",
    textMuted: "#5a7aaa",
    timeAccent:"#f5c000",
    divider:   "rgba(36,85,164,.25)",
    rowHover:  "rgba(36,85,164,.12)",
    rankClr:   "#3a5888",
    listBg:    "#07111f",
    footerBg:  "#040c18",
    footerClr: "#1e3a6a",
    gradFade:  "#07111f",
    emptyClr:  "#1e3055",
  } : {
    pageBg:    "#dce6f5",
    heroGrad:  "linear-gradient(160deg, #2455a4 0%, #1a3d7a 60%)",
    cardBg:    "rgba(255,255,255,.85)",
    cardBdr:   "rgba(36,85,164,.3)",
    textHero:  "#ffffff",
    textName:  "#ffffff",
    textTime:  "#ffffff",
    textMuted: "#8faacc",
    timeAccent:"#f5c000",
    divider:   "rgba(36,85,164,.2)",
    rowHover:  "rgba(36,85,164,.07)",
    rankClr:   "#6080b0",
    listBg:    "#dce6f5",
    footerBg:  "#1a3d7a",
    footerClr: "#6090c0",
    gradFade:  "#dce6f5",
    emptyClr:  "#7090c0",
  };
}

const MEDAL_CLR = ["#f5c000", "#c0c0c0", "#cd7f32"];
const MEDAL_GLOW = ["rgba(245,192,0,.5)", "rgba(192,192,192,.4)", "rgba(205,127,50,.4)"];

/* ── Winner card (full width) ─────────────────────────────────────────── */
function WinnerCard({ entry, tk }: { entry: SimEntry; tk: ReturnType<typeof tokens> }) {
  return (
    <div style={{
      position: "relative",
      padding: "28px 36px 28px",
      display: "flex",
      alignItems: "center",
      gap: 32,
      overflow: "hidden",
    }}>
      {/* Number badge */}
      <div style={{
        width: 64, height: 64,
        borderRadius: "50%",
        background: MEDAL_CLR[0],
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, fontWeight: 900, color: "#111",
        boxShadow: `0 4px 24px ${MEDAL_GLOW[0]}`,
        flexShrink: 0,
      }}>1</div>

      {/* Name + day */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "clamp(1.8rem, 5vw, 3.2rem)",
          fontWeight: 900,
          color: tk.textHero,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {entry.name}
        </div>
        <div style={{ fontSize: 13, color: tk.textMuted, marginTop: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {dayLabel(entry.day as SimDay)}
        </div>
      </div>

      {/* Time */}
      <div style={{
        fontFamily: "monospace",
        fontSize: "clamp(2rem, 6vw, 4rem)",
        fontWeight: 900,
        color: tk.timeAccent,
        letterSpacing: "0.04em",
        lineHeight: 1,
        flexShrink: 0,
        textShadow: `0 0 32px ${MEDAL_GLOW[0]}`,
      }}>
        {formatTimeMs(entry.bestTimeMs)}
      </div>
    </div>
  );
}

/* ── Podium slot for #2 / #3 ─────────────────────────────────────────── */
function PodiumSlot({ entry, rank, tk }: { entry: SimEntry; rank: number; tk: ReturnType<typeof tokens> }) {
  const clr = MEDAL_CLR[rank];
  const glow = MEDAL_GLOW[rank];
  return (
    <div style={{
      flex: 1,
      padding: "20px 24px",
      background: tk.cardBg,
      border: `1.5px solid ${clr}44`,
      borderTop: `3px solid ${clr}`,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      gap: 16,
      boxShadow: `0 4px 20px ${glow}`,
    }}>
      {/* Badge */}
      <div style={{
        width: 40, height: 40,
        borderRadius: "50%",
        background: clr,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, fontWeight: 900, color: "#111",
        flexShrink: 0,
      }}>{rank + 1}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
          fontWeight: 700,
          color: tk.textName,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.1,
        }}>{entry.name}</div>
        <div style={{ fontSize: 11, color: tk.textMuted, marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {dayLabel(entry.day as SimDay)}
        </div>
      </div>

      <div style={{
        fontFamily: "monospace",
        fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
        fontWeight: 800,
        color: clr,
      }}>
        {formatTimeMs(entry.bestTimeMs)}
      </div>
    </div>
  );
}

/* ── List row for rank 4+ ─────────────────────────────────────────────── */
function ListRow({ entry, rank, tk }: { entry: SimEntry; rank: number; tk: ReturnType<typeof tokens> }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "11px 20px",
      borderBottom: `1px solid ${tk.divider}`,
    }}>
      <span style={{ width: 36, fontSize: 13, fontWeight: 700, color: tk.rankClr }}>{rank}</span>
      <span style={{ flex: 1, fontSize: "1rem", fontWeight: 600, color: tk.textName, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {entry.name}
      </span>
      <span style={{ fontSize: 11, color: tk.textMuted, marginRight: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {dayLabel(entry.day as SimDay)}
      </span>
      <span style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, color: tk.textMuted }}>
        {formatTimeMs(entry.bestTimeMs)}
      </span>
    </div>
  );
}

/* ── App ──────────────────────────────────────────────────────────────── */
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [entries, setEntries] = useState<SimEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [res, theme] = await Promise.all([fetchLeaderboard(), fetchTheme()]);
      setEntries([...res.entries].sort((a, b) => a.bestTimeMs - b.bestTimeMs));
      setIsDark(theme === "dark");
      setLastUpdated(new Date());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const tk = tokens(isDark);
  const [p1, p2, p3, ...rest] = entries;
  const scrollDur = Math.max(12, rest.length * 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: tk.pageBg, color: tk.textName, fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 24px",
        background: "linear-gradient(90deg, #2455a4 0%, #1a3d7a 100%)",
        borderBottom: "3px solid #f5c000",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/msc-logo.png" alt="MSC" style={{ height: 44, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: "clamp(.95rem, 2.2vw, 1.3rem)", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
              Simulator-Bestenliste
            </div>
            <div style={{ fontSize: "clamp(.6rem, 1.2vw, .78rem)", color: "#f5c000", fontWeight: 700, marginTop: 3, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              MSC Oberlausitzer Dreiländereck
            </div>
          </div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: error ? "#ef4444" : lastUpdated ? "#22c55e" : "#f5c00088", transition: "background .5s" }} />
      </header>

      {/* ── BODY ───────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {entries.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 52, opacity: .25 }}>🏁</div>
            <div style={{ fontSize: "1.1rem", color: tk.emptyClr }}>Noch keine Zeiten eingetragen.</div>
          </div>
        ) : (
          <>
            {/* HERO: Winner */}
            <div style={{ background: tk.heroGrad, flexShrink: 0, borderBottom: `1px solid ${tk.divider}` }}>
              {p1 && <WinnerCard entry={p1} tk={tk} />}
            </div>

            {/* P2 + P3 */}
            {(p2 || p3) && (
              <div style={{ display: "flex", gap: 12, padding: "14px 20px", flexShrink: 0, background: tk.pageBg }}>
                {p2 && <PodiumSlot entry={p2} rank={1} tk={tk} />}
                {p3 && <PodiumSlot entry={p3} rank={2} tk={tk} />}
              </div>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <>
                <div style={{ margin: "0 20px", borderTop: `1px solid ${tk.divider}`, display: "flex", alignItems: "center", gap: 10, padding: "5px 0", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: tk.textMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>Weitere Platzierungen</span>
                  <div style={{ flex: 1, height: 1, background: tk.divider }} />
                </div>

                <section style={{ flex: 1, overflow: "hidden", position: "relative", background: tk.listBg }}>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, background: `linear-gradient(to bottom, transparent, ${tk.gradFade})`, zIndex: 2, pointerEvents: "none" }} />
                  <div className="auto-scroll" style={{ "--dur": `${scrollDur}s` } as React.CSSProperties}>
                    {[...rest, ...rest].map((e, i) => (
                      <ListRow key={`${e.id}-${i}`} entry={e} rank={i % rest.length + 4} tk={tk} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{ padding: "4px 24px", borderTop: `1px solid ${tk.divider}`, fontSize: 10, color: tk.footerClr, background: tk.footerBg, flexShrink: 0 }}>
        MSC Oberlausitzer Dreiländereck e.V.
      </footer>
    </div>
  );
}
