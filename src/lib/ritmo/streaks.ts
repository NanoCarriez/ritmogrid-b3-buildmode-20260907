import { addDays, eachDay, startOfMonth, startOfWeek, toISODate } from "./dates";
import type { DayEntry, FrequencyKind, Habit, WeekStart } from "./types";

export type EntriesMap = Record<string, Record<string, DayEntry>>;

export function createdDate(habit: Habit): string {
  return habit.createdAt.slice(0, 10);
}

export function entryValue(entries: EntriesMap, habitId: string, date: string): number {
  return entries[habitId]?.[date]?.v ?? 0;
}

export function entryNote(entries: EntriesMap, habitId: string, date: string): string {
  return entries[habitId]?.[date]?.note ?? "";
}

/**
 * A day "meets" the habit:
 * - build: logged value >= dailyTarget
 * - quit: no slip (value === 0 / absent) on days within [created, asOf]
 */
export function isDayMet(
  habit: Habit,
  date: string,
  entries: EntriesMap,
  asOf: string,
): boolean {
  if (date > asOf) return false;
  const v = entryValue(entries, habit.id, date);
  if (habit.kind === "quit") return v <= 0;
  return v >= Math.max(1, habit.dailyTarget);
}

export function isDayLogged(habit: Habit, date: string, entries: EntriesMap): boolean {
  const rec = entries[habit.id]?.[date];
  if (!rec) return false;
  if (habit.kind === "quit") return rec.v > 0;
  return rec.v > 0;
}

export interface StreakResult {
  current: number;
  best: number;
  unit: "days" | "weeks" | "months";
}

function dailyStreaks(habit: Habit, entries: EntriesMap, asOf: string): StreakResult {
  const created = createdDate(habit);
  if (asOf < created) return { current: 0, best: 0, unit: "days" };

  let best = 0;
  let run = 0;
  for (const day of eachDay(created, asOf)) {
    if (isDayMet(habit, day, entries, asOf)) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }

  let current = 0;
  let cursor = asOf;
  if (!isDayMet(habit, cursor, entries, asOf)) {
    cursor = addDays(cursor, -1);
  }
  while (cursor >= created && isDayMet(habit, cursor, entries, asOf)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, best, unit: "days" };
}

function periodKey(
  date: string,
  kind: Exclude<FrequencyKind, "daily">,
  weekStartsOn: WeekStart,
): string {
  if (kind === "weekly") return startOfWeek(date, weekStartsOn);
  return startOfMonth(date);
}

function nextPeriod(start: string, kind: Exclude<FrequencyKind, "daily">): string {
  if (kind === "weekly") return addDays(start, 7);
  const y = parseInt(start.slice(0, 4), 10);
  const m = parseInt(start.slice(5, 7), 10);
  return toISODate(new Date(y, m, 1));
}

function periodEnd(start: string, kind: Exclude<FrequencyKind, "daily">): string {
  if (kind === "weekly") return addDays(start, 6);
  const y = parseInt(start.slice(0, 4), 10);
  const m = parseInt(start.slice(5, 7), 10);
  return toISODate(new Date(y, m, 0));
}

function periodMet(
  habit: Habit,
  periodStart: string,
  periodEndDate: string,
  entries: EntriesMap,
  asOf: string,
): boolean {
  const from = periodStart < createdDate(habit) ? createdDate(habit) : periodStart;
  const to = periodEndDate > asOf ? asOf : periodEndDate;
  if (from > to) return false;
  let n = 0;
  for (const day of eachDay(from, to)) {
    if (isDayMet(habit, day, entries, asOf)) n += 1;
  }
  return n >= Math.max(1, habit.frequencyTarget);
}

function periodStreaks(
  habit: Habit,
  entries: EntriesMap,
  asOf: string,
  weekStartsOn: WeekStart,
): StreakResult {
  const kind = habit.frequencyKind as "weekly" | "monthly";
  const created = createdDate(habit);
  const unit = kind === "weekly" ? "weeks" : "months";
  if (asOf < created) return { current: 0, best: 0, unit };

  const last = periodKey(asOf, kind, weekStartsOn);
  const periods: string[] = [];
  let c = periodKey(created, kind, weekStartsOn);
  while (c <= last) {
    periods.push(c);
    c = nextPeriod(c, kind);
  }

  const met = periods.map((start) =>
    periodMet(habit, start, periodEnd(start, kind), entries, asOf),
  );

  let best = 0;
  let run = 0;
  for (const ok of met) {
    if (ok) {
      run += 1;
      if (run > best) best = run;
    } else run = 0;
  }

  let current = 0;
  let i = met.length - 1;
  if (i >= 0 && !met[i]) i -= 1;
  while (i >= 0 && met[i]) {
    current += 1;
    i -= 1;
  }

  return { current, best, unit };
}

export function computeStreaks(
  habit: Habit,
  entries: EntriesMap,
  asOf: string,
  weekStartsOn: WeekStart = 1,
): StreakResult {
  if (habit.frequencyKind === "daily") return dailyStreaks(habit, entries, asOf);
  return periodStreaks(habit, entries, asOf, weekStartsOn);
}

/**
 * Completion rate.
 * DENOMINATOR = calendar days from createdDate through asOf, inclusive.
 * NUMERATOR = days in that range that meet the habit.
 * Empty range → 0, never NaN/Infinity.
 */
export function completionRate(
  habit: Habit,
  entries: EntriesMap,
  asOf: string,
): { rate: number; completed: number; possible: number } {
  const created = createdDate(habit);
  if (asOf < created) return { rate: 0, completed: 0, possible: 0 };
  const days = eachDay(created, asOf);
  const possible = days.length;
  let completed = 0;
  for (const day of days) {
    if (isDayMet(habit, day, entries, asOf)) completed += 1;
  }
  const rate = possible === 0 ? 0 : completed / possible;
  if (!Number.isFinite(rate)) return { rate: 0, completed, possible };
  return { rate, completed, possible };
}

export function recentTrend(
  habit: Habit,
  entries: EntriesMap,
  asOf: string,
  window = 7,
): number[] {
  const created = createdDate(habit);
  const out: number[] = [];
  for (let i = window - 1; i >= 0; i--) {
    const day = addDays(asOf, -i);
    if (day < created || day > asOf) out.push(0);
    else out.push(isDayMet(habit, day, entries, asOf) ? 1 : 0);
  }
  return out;
}

export function formatStreak(s: StreakResult): string {
  if (s.unit === "weeks") return `${s.current} sem.`;
  if (s.unit === "months") return `${s.current} mes.`;
  return String(s.current);
}

export function periodProgress(
  habit: Habit,
  entries: EntriesMap,
  asOf: string,
  weekStartsOn: WeekStart,
): { done: number; target: number } {
  if (habit.frequencyKind === "daily") {
    return {
      done: isDayMet(habit, asOf, entries, asOf) ? 1 : 0,
      target: 1,
    };
  }
  const kind = habit.frequencyKind;
  const start = periodKey(asOf, kind, weekStartsOn);
  const end = periodEnd(start, kind);
  const from = start < createdDate(habit) ? createdDate(habit) : start;
  const to = end > asOf ? asOf : end;
  let done = 0;
  if (from <= to) {
    for (const day of eachDay(from, to)) {
      if (isDayMet(habit, day, entries, asOf)) done += 1;
    }
  }
  return { done, target: Math.max(1, habit.frequencyTarget) };
}
