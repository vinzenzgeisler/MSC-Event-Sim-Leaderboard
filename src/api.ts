import type { LeaderboardResponse, SimDay } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export async function fetchLeaderboard(day?: SimDay): Promise<LeaderboardResponse> {
  const url = new URL(`${API_BASE}/public/sim/leaderboard`);
  if (day) url.searchParams.set("day", day);
  // no day = returns all entries
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<LeaderboardResponse>;
}
