import assert from "node:assert/strict";
import { test } from "node:test";
import { parseImport, buildExport } from "./export.ts";
import { DEFAULT_SETTINGS, EXPORT_SCHEMA, type RitmoState } from "./types.ts";

test("malformed import is rejected without producing data", () => {
  const bad = parseImport({ schema: "nope", habits: [] });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.match(bad.error, /Nada se modificó/);
});

test("json without schema rejected", () => {
  const bad = parseImport({ habits: [{ id: "x" }] });
  assert.equal(bad.ok, false);
});

test("valid export roundtrip", () => {
  const state: RitmoState = {
    habits: [
      {
        id: "h1",
        name: "Agua",
        emoji: "💧",
        color: "#5E7A8C",
        description: "",
        kind: "build",
        tracking: "check",
        dailyTarget: 1,
        frequencyKind: "daily",
        frequencyTarget: 1,
        archived: false,
        createdAt: "2026-09-01T00:00:00.000Z",
        order: 1,
        reminderTimes: ["08:00"],
      },
    ],
    entries: { h1: { "2026-09-01": { v: 1, note: "ok" } } },
    cierres: {},
    settings: { ...DEFAULT_SETTINGS },
  };
  const payload = buildExport(state);
  assert.equal(payload.schema, EXPORT_SCHEMA);
  const parsed = parseImport(payload);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.data.habits[0].name, "Agua");
});

test("orphan entries rejected", () => {
  const payload = {
    schema: EXPORT_SCHEMA,
    exportedAt: new Date().toISOString(),
    habits: [],
    entries: { ghost: { "2026-09-01": { v: 1 } } },
    cierres: {},
  };
  const parsed = parseImport(payload);
  assert.equal(parsed.ok, false);
});
