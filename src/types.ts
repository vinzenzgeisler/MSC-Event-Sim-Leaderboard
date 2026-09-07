export type SimDay = "saturday" | "sunday";

export type SimEntry = {
  id: string;
  name: string;
  bestTimeMs: number;
  day: SimDay;
};

export type LeaderboardResponse = {
  ok: boolean;
  entries: SimEntry[];
  eventId: string | null;
};
