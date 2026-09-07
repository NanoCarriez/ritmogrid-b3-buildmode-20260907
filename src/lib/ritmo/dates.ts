import type { WeekStart } from "./types";

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local calendar day, never UTC. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayISO(now = new Date()): string {
  return toISODate(now);
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function diffDays(a: string, b: string): number {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function clampISO(iso: string, min: string, max: string): string {
  if (iso < min) return min;
  if (iso > max) return max;
  return iso;
}

export function startOfWeek(iso: string, weekStartsOn: WeekStart): string {
  const d = parseISODate(iso);
  const day = d.getDay();
  const offset = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - offset);
  return toISODate(d);
}

export function startOfMonth(iso: string): string {
  const d = parseISODate(iso);
  d.setDate(1);
  return toISODate(d);
}

export function endOfMonth(iso: string): string {
  const d = parseISODate(iso);
  d.setMonth(d.getMonth() + 1, 0);
  return toISODate(d);
}

export function eachDay(from: string, to: string): string[] {
  if (from > to) return [];
  const out: string[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function weekdayIndex(iso: string, weekStartsOn: WeekStart): number {
  const day = parseISODate(iso).getDay();
  return (day - weekStartsOn + 7) % 7;
}

export function formatShort(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
}

export function formatLong(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function monthLabel(iso: string): string {
  const d = parseISODate(iso);
  const s = d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function weekdayLabels(weekStartsOn: WeekStart): string[] {
  const base = ["D", "L", "M", "M", "J", "V", "S"];
  return [...base.slice(weekStartsOn), ...base.slice(0, weekStartsOn)];
}
