/** Format milliseconds → "M:SS.mmm" */
export function formatTimeMs(ms: number): string {
  const totalMs = Math.round(ms);
  const minutes = Math.floor(totalMs / 60000);
  const remaining = totalMs % 60000;
  const seconds = Math.floor(remaining / 1000);
  const milliseconds = remaining % 1000;
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}
