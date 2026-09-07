import { useCallback, useEffect, useState } from "react";
import { fetchLeaderboard } from "./api";
import { formatTimeMs } from "./utils";
import type { SimDay, SimEntry } from "./types";

const POLL_MS = 10_000;

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function currentDay(): SimDay {
  return new Date().getDay() === 6 ? "saturday" : "sunday";
}

function dayLabel(d: SimDay) {
  return d === "saturday" ? "Samstag" : "Sonntag";
}

function getTheme(): "dark" | "light" {
  return new URLSearchParams(window.location.search).get("theme") === "light"
    ? "light"
    : "dark";
}

/* ─── Medal colours ─────────────────────────────────────────────────────────── */
const MEDAL = [
  { border: "#f5c000", glow: "rgba(245,192,0,.45)", num: "1" },
  { border: "#c0c0c0", glow: "rgba(192,192,192,.35)", num: "2" },
  { border: "#cd7f32", glow: "rgba(205,127,50,.35)", num: "3" },
];

/* ─── Podium card ────────────────────────────────────────────────────────────── */
function Podium({
  entry, rank, height, podiumBg, textClr,
}: {
  entry: SimEntry; rank: number; height: string;
  podiumBg: string; textClr: string;
}) {
  const m = MEDAL[rank];
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-end", flex: 1,
      background: podiumBg,
      border: `2px solid ${m.border}44`,
      borderRadius: 16,
      padding: "20px 12px 20px",
      gap: 10,
      minHeight: height,
      position: "relative",
      boxShadow: `0 0 28px ${m.glow}`,
    }}>
      <div style={{
        position: "absolute", top: -18,
        width: 36, height: 36, borderRadius: "50%",
        background: m.border,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: 800, color: "#111",
        boxShadow: `0 2px 12px ${m.glow}`,
      }}>{m.num}</div>

      <div style={{
        fontFamily: "monospace", fontWeight: 700,
        fontSize: "clamp(1.2rem, 3vw, 2rem)",
        color: m.border,
        letterSpacing: "0.04em",
        lineHeight: 1,
      }}>
        {formatTimeMs(entry.bestTimeMs)}
      </div>

      <div style={{
        fontSize: "clamp(.9rem, 2vw, 1.15rem)",
        fontWeight: 600,
        color: textClr,
        textAlign: "center",
        wordBreak: "break-word",
        lineHeight: 1.2,
      }}>
        {entry.name}
      </div>
    </div>
  );
}

/* ─── Rest row ───────────────────────────────────────────────────────────────── */
function Row({ entry, rank, rowBorder, nameClr, timeClr }: {
  entry: SimEntry; rank: number;
  rowBorder: string; nameClr: string; timeClr: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "10px 20px",
      borderBottom: `1px solid ${rowBorder}`,
    }}>
      <span style={{ width: 32, fontSize: 13, color: "#8899bb", fontWeight: 700 }}>{rank}</span>
      <span style={{ flex: 1, fontSize: "1.05rem", fontWeight: 600, color: nameClr }}>{entry.name}</span>
      <span style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 700, color: timeClr }}>
        {formatTimeMs(entry.bestTimeMs)}
      </span>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────────── */
export default function App() {
  const [isDark] = useState(() => getTheme() === "dark");
  const [day] = useState<SimDay>(currentDay);
  const [entries, setEntries] = useState<SimEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchLeaderboard(day);
      setEntries([...res.entries].filter(e => e.day === day).sort((a, b) => a.bestTimeMs - b.bestTimeMs));
      setLastUpdated(new Date());
      setError(false);
    } catch {
      setError(true);
    }
  }, [day]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  /* ── theme tokens ── */
  const tk = isDark ? {
    bg:           "#0b1423",
    text:         "#f0f4ff",
    muted:        "#8899bb",
    headerBg:     "linear-gradient(90deg, #162240 0%, #0d1829 100%)",
    headerBorder: "#2455a4",
    subtitleClr:  "#f5c000",
    footerBg:     "#0d1829",
    footerClr:    "#2455a4",
    podiumBg:     "linear-gradient(180deg, rgba(36,85,164,.18) 0%, rgba(36,85,164,.06) 100%)",
    rowBorder:    "rgba(36,85,164,.2)",
    nameClr:      "#e8eeff",
    timeClr:      "#8ab4f8",
    emptyClr:     "#2a3a55",
    placeholderBorder: "2px dashed rgba(36,85,164,.25)",
    dividerClr:   "rgba(36,85,164,.3)",
    gradFade:     "#0b1423",
  } : {
    bg:           "#f0f4fb",
    text:         "#1a2455",
    muted:        "#6b82aa",
    headerBg:     "linear-gradient(90deg, #2455a4 0%, #1a3d7a 100%)",
    headerBorder: "#1a3d7a",
    subtitleClr:  "#f5c000",
    footerBg:     "#1e3a7a",
    footerClr:    "#a0bce8",
    podiumBg:     "linear-gradient(180deg, rgba(36,85,164,.1) 0%, rgba(36,85,164,.03) 100%)",
    rowBorder:    "rgba(36,85,164,.12)",
    nameClr:      "#1a2455",
    timeClr:      "#2455a4",
    emptyClr:     "#6b82aa",
    placeholderBorder: "2px dashed rgba(36,85,164,.15)",
    dividerClr:   "rgba(36,85,164,.2)",
    gradFade:     "#f0f4fb",
  };

  const top3 = entries.slice(0, 3);
  const rest  = entries.slice(3);
  const scrollDur = Math.max(14, rest.length * 3);
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const heights = ["155px", "190px", "130px"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: tk.bg, overflow: "hidden" }}>

      {/* HEADER */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 24px",
        background: tk.headerBg,
        borderBottom: `2px solid ${tk.headerBorder}`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/msc-logo.png" alt="MSC Logo" style={{ height: 50, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
              Simulator-Bestenliste
            </div>
            <div style={{ fontSize: "clamp(.7rem, 1.5vw, .85rem)", color: tk.subtitleClr, fontWeight: 600, marginTop: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              MSC Oberlausitzer Dreiländereck · {dayLabel(day)}
            </div>
          </div>
        </div>

        {/* silent status dot */}
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: error ? "#ef444455" : lastUpdated ? "#22c55e" : "#f5c00088",
          transition: "background .5s",
        }} />
      </header>

      {/* BODY */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {entries.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ fontSize: 48, opacity: .3 }}>🏁</div>
            <div style={{ color: tk.emptyClr, fontSize: "1.1rem" }}>
              Noch keine Zeiten für {dayLabel(day)} eingetragen.
            </div>
          </div>
        ) : (
          <>
            {/* PODIUM */}
            <section style={{ padding: "28px 24px 16px", flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "#f5c000", textTransform: "uppercase", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(245,192,0,.3)" }} />
                TOP 3
                <div style={{ flex: 1, height: 1, background: "rgba(245,192,0,.3)" }} />
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                {podiumOrder.map((entry, i) => {
                  if (!entry) return (
                    <div key={i} style={{ flex: 1, minHeight: heights[i], border: tk.placeholderBorder, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: tk.emptyClr, fontSize: 18 }}>–</div>
                  );
                  const rankIndex = i === 0 ? 1 : i === 1 ? 0 : 2;
                  return <Podium key={entry.id} entry={entry} rank={rankIndex} height={heights[i]} podiumBg={tk.podiumBg} textClr={tk.text} />;
                })}
              </div>
            </section>

            {/* DIVIDER */}
            {rest.length > 0 && (
              <div style={{ margin: "0 24px", borderTop: `1px solid ${tk.dividerClr}`, display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                <span style={{ fontSize: 10, color: tk.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>Weitere Platzierungen</span>
                <div style={{ flex: 1, height: 1, background: tk.dividerClr }} />
              </div>
            )}

            {/* SCROLLING LIST */}
            {rest.length > 0 && (
              <section style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, zIndex: 2, background: `linear-gradient(to bottom, transparent, ${tk.gradFade})`, pointerEvents: "none" }} />
                <div className="auto-scroll" style={{ "--dur": `${scrollDur}s` } as React.CSSProperties}>
                  {[...rest, ...rest].map((e, i) => (
                    <Row key={`${e.id}-${i}`} entry={e} rank={i % rest.length + 4} rowBorder={tk.rowBorder} nameClr={tk.nameClr} timeClr={tk.timeClr} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ padding: "5px 24px", borderTop: `1px solid ${tk.dividerClr}`, fontSize: 10, color: tk.footerClr, display: "flex", justifyContent: "space-between", flexShrink: 0, background: tk.footerBg }}>
        <span>MSC Oberlausitzer Dreiländereck e.V.</span>
      </footer>
    </div>
  );
}
