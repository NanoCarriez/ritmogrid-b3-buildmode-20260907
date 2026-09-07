import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultHabit, type Habit } from "./types";
import { completionRate, computeStreaks, type EntriesMap } from "./streaks";

function habitAt(created: string): Habit {
  return defaultHabit({
    id: "h1",
    name: "Fixture",
    createdAt: `${created}T08:00:00.000Z`,
    kind: "build",
    tracking: "check",
    dailyTarget: 1,
    frequencyKind: "daily",
    frequencyTarget: 1,
  });
}

function entriesFromPattern(id: string, start: string, pattern: boolean[]): EntriesMap {
  const days: Record<string, { v: number }> = {};
  const [y, m, d] = start.split("-").map(Number);
  for (let i = 0; i < pattern.length; i++) {
    const dt = new Date(y, m - 1, d + i);
    const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    if (pattern[i]) days[iso] = { v: 1 };
  }
  return { [id]: days };
}

test("A06: D1 yes D2 yes D3 no D4 yes D5 yes D6 yes → current 3, best 3", () => {
  const start = "2026-08-01";
  const h = habitAt(start);
  const entries = entriesFromPattern("h1", start, [true, true, false, true, true, true]);
  const asOf = "2026-08-06";
  const s = computeStreaks(h, entries, asOf);
  assert.equal(s.current, 3);
  assert.equal(s.best, 3);
});

test("A07: editing D3 to yes → current 6, best 6", () => {
  const start = "2026-08-01";
  const h = habitAt(start);
  const entries = entriesFromPattern("h1", start, [true, true, true, true, true, true]);
  const asOf = "2026-08-06";
  const s = computeStreaks(h, entries, asOf);
  assert.equal(s.current, 6);
  assert.equal(s.best, 6);
});

test("A08: empty history → 0/0 rate, no NaN", () => {
  const h = habitAt("2026-09-07");
  const s = computeStreaks(h, {}, "2026-09-06");
  assert.equal(s.current, 0);
  assert.equal(s.best, 0);
  const r = completionRate(h, {}, "2026-09-06");
  assert.equal(r.rate, 0);
  assert.equal(Number.isFinite(r.rate), true);
  assert.equal(Number.isNaN(r.rate), false);
});

test("A08: created today, no logs → rate 0, streak 0", () => {
  const h = habitAt("2026-09-07");
  const s = computeStreaks(h, {}, "2026-09-07");
  assert.equal(s.current, 0);
  const r = completionRate(h, {}, "2026-09-07");
  assert.equal(r.possible, 1);
  assert.equal(r.completed, 0);
  assert.equal(r.rate, 0);
});

test("weekly frequency changes streak unit", () => {
  const h = defaultHabit({
    id: "h1",
    name: "Gym",
    createdAt: "2026-08-03T08:00:00.000Z",
    frequencyKind: "weekly",
    frequencyTarget: 3,
  });
  const entries = entriesFromPattern("h1", "2026-08-03", [
    true, true, true, false, false, false, false,
    true, true, true, false, false, false, false,
  ]);
  const s = computeStreaks(h, entries, "2026-08-16", 1);
  assert.equal(s.unit, "weeks");
  assert.ok(s.current >= 2);
});
