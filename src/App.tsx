import { useCallback, useEffect, useState } from "react";
import { fetchLeaderboard, fetchTheme } from "./api";
import { formatTimeMs } from "./utils";
import type { SimDay, SimEntry } from "./types";

const POLL_MS = 10_000;

function dayLabel(d: SimDay) {
  return d === "saturday" ? "Sa" : "So";
}

/* ── Standard competition rank ────────────────────────────────────────────
   Ties share a rank; the next distinct time gets rank = position + 1.
   e.g. times [30, 30, 35] → ranks [1, 1, 3]
────────────────────────────────────────────────────────────────────────── */
type Ranked = { entry: SimEntry; rank: number };

function computeRanks(sorted: SimEntry[]): Ranked[] {
  return sorted.map((entry) => ({
    entry,
    rank: 1 + sorted.filter((e) => e.bestTimeMs < entry.bestTimeMs).length,
  }));
}

/* ── Theme tokens ─────────────────────────────────────────────────────── */
function tokens(dark: boolean) {
  return dark
    ? {
        pageBg:   "#07111f",
        heroGrad: "linear-gradient(160deg, #0f2040 0%, #07111f 60%)",
        cardBg:   "rgba(255,255,255,.04)",
        cardBdr:  "rgba(36,85,164,.4)",
        textHero: "#f0f6ff",
        textName: "#ddeeff",
        textMuted:"#5a7aaa",
        timeGold: "#f5c000",
        divider:  "rgba(36,85,164,.25)",
        rankClr:  "#3a5888",
        listBg:   "#07111f",
        footerBg: "#040c18",
        footerClr:"#1e3a6a",
        gradFade: "#07111f",
        emptyClr: "#1e3055",
      }
    : {
        pageBg:   "#dce6f5",
        heroGrad: "linear-gradient(160deg, #2455a4 0%, #1a3d7a 60%)",
        cardBg:   "rgba(255,255,255,.9)",
        cardBdr:  "rgba(36,85,164,.3)",
        textHero: "#ffffff",
        textName: "#ffffff",
        textMuted:"#8faacc",
        timeGold: "#f5c000",
        divider:  "rgba(36,85,164,.2)",
        rankClr:  "#6080b0",
        listBg:   "#dce6f5",
        footerBg: "#1a3d7a",
        footerClr:"#6090c0",
        gradFade: "#dce6f5",
        emptyClr: "#7090c0",
      };
}

const MEDAL = [
  { clr: "#f5c000", glow: "rgba(245,192,0,.5)" },
  { clr: "#c0c0c0", glow: "rgba(192,192,192,.4)" },
  { clr: "#cd7f32", glow: "rgba(205,127,50,.4)" },
];
const medalFor = (rank: number) => MEDAL[rank - 1] ?? MEDAL[2];

/* ── Winner hero ──────────────────────────────────────────────────────── */
function WinnerCard({ item, tk }: { item: Ranked; tk: ReturnType<typeof tokens> }) {
  const m = medalFor(item.rank);
  return (
    <div style={{ padding: "28px 36px", display: "flex", alignItems: "center", gap: 28 }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: m.clr,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, fontWeight: 900, color: "#111",
        boxShadow: `0 4px 24px ${m.glow}`,
        flexShrink: 0,
      }}>
        {item.rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "clamp(1.8rem, 5vw, 3.2rem)",
          fontWeight: 900, color: tk.textHero,
          lineHeight: 1, letterSpacing: "-0.01em",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {item.entry.name}
        </div>
        <div style={{ fontSize: 12, color: tk.textMuted, marginTop: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {dayLabel(item.entry.day as SimDay)}
        </div>
      </div>
      <div style={{
        fontFamily: "monospace",
        fontSize: "clamp(2rem, 6vw, 4rem)",
        fontWeight: 900, color: m.clr,
        letterSpacing: "0.04em", lineHeight: 1,
        flexShrink: 0, textShadow: `0 0 32px ${m.glow}`,
      }}>
        {formatTimeMs(item.entry.bestTimeMs)}
      </div>
    </div>
  );
}

/* ── Podium slot (#2 / #3) ────────────────────────────────────────────── */
function PodiumSlot({ item, tk }: { item: Ranked; tk: ReturnType<typeof tokens> }) {
  const m = medalFor(item.rank);
  return (
    <div style={{
      flex: 1, padding: "18px 20px",
      background: tk.cardBg,
      border: `1.5px solid ${m.clr}44`,
      borderTop: `3px solid ${m.clr}`,
      borderRadius: 12,
      display: "flex", alignItems: "center", gap: 14,
      boxShadow: `0 4px 20px ${m.glow}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: m.clr,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 17, fontWeight: 900, color: "#111",
        flexShrink: 0,
      }}>
        {item.rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "clamp(1rem, 2.2vw, 1.3rem)", fontWeight: 700,
          color: tk.textName,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {item.entry.name}
        </div>
        <div style={{ fontSize: 11, color: tk.textMuted, marginTop: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {dayLabel(item.entry.day as SimDay)}
        </div>
      </div>
      <div style={{ fontFamily: "monospace", fontSize: "clamp(1rem, 2.2vw, 1.5rem)", fontWeight: 800, color: m.clr, flexShrink: 0 }}>
        {formatTimeMs(item.entry.bestTimeMs)}
      </div>
    </div>
  );
}

/* ── Scrolling list row ────────────────────────────────────────────────── */
function ListRow({ item, tk }: { item: Ranked; tk: ReturnType<typeof tokens> }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "11px 20px", borderBottom: `1px solid ${tk.divider}` }}>
      <span style={{ width: 36, fontSize: 13, fontWeight: 700, color: tk.rankClr }}>{item.rank}</span>
      <span style={{ flex: 1, fontSize: "1rem", fontWeight: 600, color: tk.textName, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {item.entry.name}
      </span>
      <span style={{ fontSize: 11, color: tk.textMuted, marginRight: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {dayLabel(item.entry.day as SimDay)}
      </span>
      <span style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, color: tk.textMuted }}>
        {formatTimeMs(item.entry.bestTimeMs)}
      </span>
    </div>
  );
}

/* ── App ─────────────────────────────────────────────────────────────── */
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [res, theme] = await Promise.all([fetchLeaderboard(), fetchTheme()]);
      // Sort purely by time (API may return day-grouped)
      const sorted = [...res.entries].sort((a, b) => a.bestTimeMs - b.bestTimeMs);
      setRanked(computeRanks(sorted));
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

  // Split: podium positions are always the first 3 distinct DISPLAY slots
  // but we only split at entry 3 — ties still shown in their rank
  const podium = ranked.slice(0, Math.min(3, ranked.length));
  const rest   = ranked.slice(podium.length);
  const [slot1, slot2, slot3] = podium;

  const scrollDur = Math.max(12, rest.length * 3);
  // Duplicate rest for seamless infinite scroll; use precomputed rank (never index-derived)
  const scrollItems = [...rest, ...rest];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: tk.pageBg, color: tk.textName, fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>

      {/* HEADER */}
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

      {/* BODY */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {ranked.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 52, opacity: .25 }}>🏁</div>
            <div style={{ fontSize: "1.1rem", color: tk.emptyClr }}>Noch keine Zeiten eingetragen.</div>
          </div>
        ) : (
          <>
            {/* HERO – always the first entry (fastest) */}
            <div style={{ background: tk.heroGrad, flexShrink: 0, borderBottom: `1px solid ${tk.divider}` }}>
              {slot1 && <WinnerCard item={slot1} tk={tk} />}
            </div>

            {/* Slots 2 + 3 */}
            {(slot2 || slot3) && (
              <div style={{ display: "flex", gap: 12, padding: "14px 20px", flexShrink: 0, background: tk.pageBg }}>
                {slot2 && <PodiumSlot item={slot2} tk={tk} />}
                {slot3 && <PodiumSlot item={slot3} tk={tk} />}
              </div>
            )}

            {/* Remaining – scrolling, ranks from precomputed values */}
            {rest.length > 0 && (
              <>
                <div style={{ margin: "0 20px", borderTop: `1px solid ${tk.divider}`, display: "flex", alignItems: "center", gap: 10, padding: "5px 0", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: tk.textMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>Weitere Platzierungen</span>
                  <div style={{ flex: 1, height: 1, background: tk.divider }} />
                </div>
                <section style={{ flex: 1, overflow: "hidden", position: "relative", background: tk.listBg }}>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, background: `linear-gradient(to bottom, transparent, ${tk.gradFade})`, zIndex: 2, pointerEvents: "none" }} />
                  <div className="auto-scroll" style={{ "--dur": `${scrollDur}s` } as React.CSSProperties}>
                    {scrollItems.map((item, i) => (
                      <ListRow key={`${item.entry.id}-${i}`} item={item} tk={tk} />
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ padding: "4px 24px", borderTop: `1px solid ${tk.divider}`, fontSize: 10, color: tk.footerClr, background: tk.footerBg, flexShrink: 0 }}>
        MSC Oberlausitzer Dreiländereck e.V.
      </footer>
    </div>
  );
}
