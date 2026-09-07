import { useCallback, useEffect, useRef, useState } from "react";
import { fetchLeaderboard } from "./api";
import { formatTimeMs } from "./utils";
import type { SimDay, SimEntry } from "./types";

const POLL_INTERVAL_MS = 10_000;
const SCROLL_PAUSE_MS = 4_000; // pause on top-3 before scrolling to rest

// ---------------------------------------------------------------------------
// Medal colours
// ---------------------------------------------------------------------------
const MEDAL: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: "#f4c430", text: "#1a1200", label: "1" },
  1: { bg: "#c0c0c0", text: "#1a1a1a", label: "2" },
  2: { bg: "#cd7f32", text: "#1a0d00", label: "3" }
};

// ---------------------------------------------------------------------------
// Podium card
// ---------------------------------------------------------------------------
function PodiumCard({
  rank,
  entry,
  order
}: {
  rank: number;
  entry: SimEntry;
  order: "first" | "second" | "third";
}) {
  const medal = MEDAL[rank];
  const sizes = {
    first: "flex-[1.4] text-5xl py-8",
    second: "flex-[1.1] text-4xl py-6",
    third: "flex-1 text-3xl py-4"
  };

  return (
    <div
      className={`flex flex-col items-center justify-end rounded-2xl px-6 text-center transition-all ${sizes[order]}`}
      style={{ background: "rgba(255,255,255,0.04)", border: `2px solid ${medal.bg}33` }}
    >
      {/* Rank badge */}
      <div
        className="rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mb-3 flex-shrink-0"
        style={{ background: medal.bg, color: medal.text }}
      >
        {medal.label}
      </div>
      {/* Time */}
      <div className="font-mono font-bold text-white" style={{ fontSize: "inherit" }}>
        {formatTimeMs(entry.bestTimeMs)}
      </div>
      {/* Name */}
      <div className="mt-2 text-base font-semibold" style={{ color: medal.bg, wordBreak: "break-word" }}>
        {entry.name}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rest list row
// ---------------------------------------------------------------------------
function ListRow({ rank, entry }: { rank: number; entry: SimEntry }) {
  return (
    <div
      className="flex items-center px-6 py-3 border-b"
      style={{ borderColor: "rgba(255,255,255,0.07)" }}
    >
      <span className="w-10 text-sm font-bold" style={{ color: "#94a3b8" }}>
        {rank}
      </span>
      <span className="flex-1 font-semibold text-white text-lg truncate">{entry.name}</span>
      <span className="font-mono text-xl font-bold" style={{ color: "#94a3b8" }}>
        {formatTimeMs(entry.bestTimeMs)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day tab
// ---------------------------------------------------------------------------
function DayTab({
  day,
  active,
  onClick
}: {
  day: SimDay;
  active: boolean;
  onClick: () => void;
}) {
  const label = day === "saturday" ? "Samstag" : "Sonntag";
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 20px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        fontSize: 15,
        fontWeight: 600,
        background: active ? "#e63946" : "rgba(255,255,255,0.08)",
        color: active ? "#fff" : "#94a3b8",
        transition: "all .15s"
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const [day, setDay] = useState<SimDay>(() => {
    const dow = new Date().getDay();
    return dow === 6 ? "saturday" : "sunday";
  });
  const [entries, setEntries] = useState<SimEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchLeaderboard(day);
      setEntries(res.entries.filter((e) => e.day === day).sort((a, b) => a.bestTimeMs - b.bestTimeMs));
      setLastUpdated(new Date());
      setError(false);
    } catch {
      setError(true);
    }
  }, [day]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Scroll duration: 3s per extra entry, min 12s
  const scrollDuration = Math.max(12, rest.length * 3);

  // Duplicate rest list for seamless loop
  const scrollList = rest.length > 0 ? [...rest, ...rest] : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#0a0f1a",
        color: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
        overflow: "hidden"
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src="/msc-logo.png" alt="MSC Logo" style={{ height: 48 }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Simulator-Bestenliste</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>MSC Oberlausitz · Dreiecksrennen</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <DayTab day="saturday" active={day === "saturday"} onClick={() => setDay("saturday")} />
          <DayTab day="sunday" active={day === "sunday"} onClick={() => setDay("sunday")} />
        </div>
        <div style={{ fontSize: 12, color: "#475569", textAlign: "right" }}>
          {error ? (
            <span style={{ color: "#e63946" }}>⚠ Verbindungsfehler</span>
          ) : lastUpdated ? (
            <>
              Aktualisiert{" "}
              {lastUpdated.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </>
          ) : (
            "Lade…"
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {entries.length === 0 && !error ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              color: "#475569"
            }}
          >
            Noch keine Zeiten eingetragen.
          </div>
        ) : (
          <>
            {/* ── Podium ── */}
            <section
              style={{
                padding: "20px 28px 12px",
                flexShrink: 0
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#64748b", marginBottom: 12 }}>
                TOP 3
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                {/* 2nd – 1st – 3rd visual order */}
                {top3[1] && (
                  <PodiumCard rank={1} entry={top3[1]} order="second" />
                )}
                {top3[0] && (
                  <PodiumCard rank={0} entry={top3[0]} order="first" />
                )}
                {top3[2] && (
                  <PodiumCard rank={2} entry={top3[2]} order="third" />
                )}
                {/* Placeholders when fewer than 3 entries */}
                {top3.length < 3 &&
                  Array.from({ length: 3 - top3.length }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        border: "2px dashed rgba(255,255,255,0.08)",
                        borderRadius: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px 0",
                        color: "#334155",
                        fontSize: 14
                      }}
                    >
                      –
                    </div>
                  ))}
              </div>
            </section>

            {/* ── Divider ── */}
            {rest.length > 0 && (
              <div
                style={{
                  margin: "0 28px",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: 0
                }}
              />
            )}

            {/* ── Scrolling rest ── */}
            {rest.length > 0 && (
              <section
                style={{
                  flex: 1,
                  overflow: "hidden",
                  position: "relative"
                }}
              >
                {/* Gradient fade at bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 60,
                    background: "linear-gradient(to bottom, transparent, #0a0f1a)",
                    zIndex: 2,
                    pointerEvents: "none"
                  }}
                />

                <div
                  className="scrolling-list"
                  style={
                    {
                      "--scroll-duration": `${scrollDuration}s`
                    } as React.CSSProperties
                  }
                >
                  {scrollList.map((entry, i) => (
                    <ListRow key={`${entry.id}-${i}`} rank={i % rest.length + 4} entry={entry} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: "6px 28px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          fontSize: 11,
          color: "#334155",
          display: "flex",
          justifyContent: "space-between",
          flexShrink: 0
        }}
      >
        <span>sim.event.msc-oberlausitz.de</span>
        <span>Zeiten werden alle {POLL_INTERVAL_MS / 1000}s aktualisiert</span>
      </footer>
    </div>
  );
}
