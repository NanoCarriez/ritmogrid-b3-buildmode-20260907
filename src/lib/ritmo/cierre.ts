import { isDayMet, type EntriesMap } from "./streaks";
import type { Cierre, Habit } from "./types";

export function pendingToday(habits: Habit[], entries: EntriesMap, today: string): Habit[] {
  return habits.filter((h) => !h.archived && !isDayMet(h, today, entries, today));
}

export function computeCierreScore(
  habits: Habit[],
  entries: EntriesMap,
  today: string,
): number {
  const active = habits.filter((h) => !h.archived);
  if (active.length === 0) return 0;
  let met = 0;
  for (const h of active) {
    if (isDayMet(h, today, entries, today)) met += 1;
  }
  return Math.round((met / active.length) * 100);
}

export function hiloLength(cierres: Record<string, Cierre>, today: string): number {
  let n = 0;
  let cursor = today;
  while (cierres[cursor]) {
    n += 1;
    const [y, m, d] = cursor.split("-").map(Number);
    const dt = new Date(y, m - 1, d - 1);
    cursor = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }
  return n;
}
