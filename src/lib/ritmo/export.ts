import { z } from "zod";
import {
  DEFAULT_SETTINGS,
  EXPORT_SCHEMA,
  type Cierre,
  type DayEntry,
  type Habit,
  type RitmoState,
  type Settings,
} from "./types";

const habitSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  emoji: z.string().min(1).max(8),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  description: z.string().max(280).optional().default(""),
  kind: z.enum(["build", "quit"]),
  tracking: z.enum(["check", "count"]),
  dailyTarget: z.number().int().min(1).max(99),
  frequencyKind: z.enum(["daily", "weekly", "monthly"]),
  frequencyTarget: z.number().int().min(1).max(62),
  archived: z.boolean(),
  createdAt: z.string().min(10),
  order: z.number().int(),
  reminderTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).max(3),
});

const entrySchema = z.object({
  v: z.number().int().min(0).max(999),
  note: z.string().max(280).optional(),
});

const cierreSchema = z.object({
  closedAt: z.string(),
  score: z.number().min(0).max(100),
  note: z.string().max(280).optional(),
  intention: z.string().max(140).optional(),
  completedIds: z.array(z.string()),
  skippedIds: z.array(z.string()),
});

const exportSchema = z.object({
  schema: z.literal(EXPORT_SCHEMA),
  exportedAt: z.string(),
  habits: z.array(habitSchema),
  entries: z.record(z.string(), z.record(z.string(), entrySchema)),
  cierres: z.record(z.string(), cierreSchema).optional().default({}),
  settings: z
    .object({
      theme: z.enum(["dark", "light", "system"]).optional(),
      weekStartsOn: z.union([z.literal(0), z.literal(1), z.literal(3)]).optional(),
      viewMode: z.enum(["grid", "compact", "list"]).optional(),
      gridWeeks: z.number().int().min(8).max(26).optional(),
    })
    .optional(),
});

export interface ExportPayload {
  schema: typeof EXPORT_SCHEMA;
  exportedAt: string;
  habits: Habit[];
  entries: Record<string, Record<string, DayEntry>>;
  cierres: Record<string, Cierre>;
  settings: Pick<Settings, "theme" | "weekStartsOn" | "viewMode" | "gridWeeks">;
}

export function buildExport(state: RitmoState): ExportPayload {
  return {
    schema: EXPORT_SCHEMA,
    exportedAt: new Date().toISOString(),
    habits: state.habits,
    entries: state.entries,
    cierres: state.cierres,
    settings: {
      theme: state.settings.theme,
      weekStartsOn: state.settings.weekStartsOn,
      viewMode: state.settings.viewMode,
      gridWeeks: state.settings.gridWeeks,
    },
  };
}

export type ImportResult =
  | { ok: true; data: ExportPayload }
  | { ok: false; error: string };

export function parseImport(raw: unknown): ImportResult {
  const parsed = exportSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path?.join(".") || "archivo";
    return {
      ok: false,
      error: `Archivo no válido (${path}: ${first?.message ?? "esquema desconocido"}). Nada se modificó.`,
    };
  }
  const ids = new Set<string>();
  for (const h of parsed.data.habits) {
    if (ids.has(h.id)) {
      return { ok: false, error: "Archivo no válido (ids de hábito duplicados). Nada se modificó." };
    }
    ids.add(h.id);
  }
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  for (const [hid, days] of Object.entries(parsed.data.entries)) {
    if (!ids.has(hid)) {
      return { ok: false, error: "Archivo no válido (entrada huérfana). Nada se modificó." };
    }
    for (const day of Object.keys(days)) {
      if (!dateRe.test(day)) {
        return { ok: false, error: "Archivo no válido (fecha malformada). Nada se modificó." };
      }
    }
  }
  return {
    ok: true,
    data: {
      schema: EXPORT_SCHEMA,
      exportedAt: parsed.data.exportedAt,
      habits: parsed.data.habits as Habit[],
      entries: parsed.data.entries,
      cierres: parsed.data.cierres as Record<string, Cierre>,
      settings: {
        theme: parsed.data.settings?.theme ?? DEFAULT_SETTINGS.theme,
        weekStartsOn: parsed.data.settings?.weekStartsOn ?? DEFAULT_SETTINGS.weekStartsOn,
        viewMode: parsed.data.settings?.viewMode ?? DEFAULT_SETTINGS.viewMode,
        gridWeeks: parsed.data.settings?.gridWeeks ?? DEFAULT_SETTINGS.gridWeeks,
      },
    },
  };
}
