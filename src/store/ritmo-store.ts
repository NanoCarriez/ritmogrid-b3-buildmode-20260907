import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { uid } from "@/lib/utils";
import {
  DEFAULT_SETTINGS,
  FREE_ACTIVE_LIMIT,
  STORAGE_KEY,
  defaultHabit,
  type Cierre,
  type Habit,
  type RitmoState,
  type Settings,
} from "@/lib/ritmo/types";
import { todayISO } from "@/lib/ritmo/dates";
import { computeCierreScore } from "@/lib/ritmo/cierre";
import { buildExport, parseImport, type ExportPayload } from "@/lib/ritmo/export";

export type Screen =
  | { t: "home" }
  | { t: "detail"; id: string }
  | { t: "form"; id?: string }
  | { t: "stats" }
  | { t: "settings" }
  | { t: "archive" }
  | { t: "pro"; reason?: string }
  | { t: "share"; id: string }
  | { t: "cierre" }
  | { t: "note"; id: string; date: string };

interface Store extends RitmoState {
  hydrated: boolean;
  screen: Screen;
  toast: string | null;
  setHydrated: () => void;
  setScreen: (s: Screen) => void;
  setToast: (m: string | null) => void;
  activeHabits: () => Habit[];
  canAddActive: () => boolean;
  addHabit: (draft: Partial<Habit> & Pick<Habit, "name">) => { ok: true; id: string } | { ok: false; reason: "limit" };
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  archiveHabit: (id: string) => void;
  restoreHabit: (id: string) => { ok: true } | { ok: false; reason: "limit" };
  deleteHabit: (id: string) => void;
  moveHabit: (id: string, dir: -1 | 1) => void;
  setDayValue: (id: string, date: string, value: number) => void;
  toggleDay: (id: string, date: string) => void;
  bumpDay: (id: string, date: string, delta: number) => void;
  setDayNote: (id: string, date: string, note: string) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  setProPreview: (on: boolean) => void;
  exportJson: () => string;
  importJson: (raw: string) => { ok: true } | { ok: false; error: string };
  closeRitmo: (input: { note?: string; intention?: string; skipIds: string[] }) => void;
  resetAll: () => void;
}

const empty: RitmoState = {
  habits: [],
  entries: {},
  cierres: {},
  settings: { ...DEFAULT_SETTINGS },
};

function sortHabits(habits: Habit[]): Habit[] {
  return [...habits].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export const useRitmo = create<Store>()(
  persist(
    (set, get) => ({
      ...empty,
      hydrated: false,
      screen: { t: "home" },
      toast: null,
      setHydrated: () => set({ hydrated: true }),
      setScreen: (screen) => set({ screen }),
      setToast: (toast) => set({ toast }),
      activeHabits: () => get().habits.filter((h) => !h.archived),
      canAddActive: () => {
        const s = get();
        if (s.settings.proPreview) return true;
        return s.habits.filter((h) => !h.archived).length < FREE_ACTIVE_LIMIT;
      },
      addHabit: (draft) => {
        const s = get();
        const archived = draft.archived ?? false;
        if (!archived && !s.canAddActive()) return { ok: false, reason: "limit" };
        const id = draft.id || uid("h");
        const order = s.habits.reduce((m, h) => Math.max(m, h.order), 0) + 1;
        const habit = defaultHabit({
          ...draft,
          id,
          order: draft.order ?? order,
          createdAt: draft.createdAt ?? new Date().toISOString(),
        });
        set({
          habits: sortHabits([...s.habits, habit]),
          settings: { ...s.settings, onboarded: true },
        });
        return { ok: true, id };
      },
      updateHabit: (id, patch) => {
        set({
          habits: get().habits.map((h) => (h.id === id ? { ...h, ...patch, id: h.id } : h)),
        });
      },
      archiveHabit: (id) => {
        set({
          habits: get().habits.map((h) => (h.id === id ? { ...h, archived: true } : h)),
          screen: { t: "home" },
        });
      },
      restoreHabit: (id) => {
        const s = get();
        if (!s.canAddActive()) return { ok: false, reason: "limit" };
        set({
          habits: s.habits.map((h) => (h.id === id ? { ...h, archived: false } : h)),
        });
        return { ok: true };
      },
      deleteHabit: (id) => {
        const s = get();
        const entries = { ...s.entries };
        delete entries[id];
        set({
          habits: s.habits.filter((h) => h.id !== id),
          entries,
          screen: { t: "home" },
        });
      },
      moveHabit: (id, dir) => {
        const habits = sortHabits(get().habits.filter((h) => !h.archived));
        const idx = habits.findIndex((h) => h.id === id);
        const swap = idx + dir;
        if (idx < 0 || swap < 0 || swap >= habits.length) return;
        const a = habits[idx];
        const b = habits[swap];
        const orderA = a.order;
        set({
          habits: get().habits.map((h) => {
            if (h.id === a.id) return { ...h, order: b.order };
            if (h.id === b.id) return { ...h, order: orderA };
            return h;
          }),
        });
      },
      setDayValue: (id, date, value) => {
        const s = get();
        const habit = s.habits.find((h) => h.id === id);
        if (!habit) return;
        const prev = s.entries[id]?.[date];
        const v = Math.max(0, Math.min(999, value));
        const next = { ...s.entries };
        const days = { ...(next[id] ?? {}) };
        if (v <= 0 && !prev?.note) {
          delete days[date];
        } else {
          days[date] = { v, note: prev?.note };
          if (!days[date].note) delete days[date].note;
        }
        next[id] = days;
        const created = habit.createdAt.slice(0, 10);
        const habits =
          date < created && v > 0
            ? s.habits.map((h) =>
                h.id === id ? { ...h, createdAt: `${date}T00:00:00.000Z` } : h,
              )
            : s.habits;
        set({ entries: next, habits });
      },
      toggleDay: (id, date) => {
        const s = get();
        const habit = s.habits.find((h) => h.id === id);
        if (!habit) return;
        const cur = s.entries[id]?.[date]?.v ?? 0;
        if (habit.kind === "quit") {
          get().setDayValue(id, date, cur > 0 ? 0 : 1);
          return;
        }
        if (habit.tracking === "count") {
          get().setDayValue(id, date, cur + 1);
          return;
        }
        get().setDayValue(id, date, cur >= habit.dailyTarget ? 0 : habit.dailyTarget);
      },
      bumpDay: (id, date, delta) => {
        const s = get();
        const habit = s.habits.find((h) => h.id === id);
        if (!habit) return;
        const cur = s.entries[id]?.[date]?.v ?? 0;
        get().setDayValue(id, date, cur + delta);
      },
      setDayNote: (id, date, note) => {
        const s = get();
        const prev = s.entries[id]?.[date];
        const next = { ...s.entries };
        const days = { ...(next[id] ?? {}) };
        const trimmed = note.trim();
        const v = prev?.v ?? 0;
        if (!trimmed && v <= 0) delete days[date];
        else days[date] = { v, note: trimmed || undefined };
        next[id] = days;
        set({ entries: next });
      },
      patchSettings: (patch) => {
        set({ settings: { ...get().settings, ...patch } });
      },
      setProPreview: (on) => {
        set({ settings: { ...get().settings, proPreview: on } });
      },
      exportJson: () => JSON.stringify(buildExport(get()), null, 2),
      importJson: (raw) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return { ok: false, error: "El archivo no es JSON válido. Nada se modificó." };
        }
        const result = parseImport(parsed);
        if (!result.ok) return result;
        const data: ExportPayload = result.data;
        set({
          habits: sortHabits(data.habits),
          entries: data.entries,
          cierres: data.cierres,
          settings: {
            ...get().settings,
            ...data.settings,
            proPreview: get().settings.proPreview,
            onboarded: true,
          },
        });
        return { ok: true };
      },
      closeRitmo: ({ note, intention, skipIds }) => {
        const s = get();
        const today = todayISO();
        const skip = new Set(skipIds);
        const active = s.habits.filter((h) => !h.archived);
        const completedIds: string[] = [];
        for (const h of active) {
          const met =
            h.kind === "quit"
              ? (s.entries[h.id]?.[today]?.v ?? 0) <= 0
              : (s.entries[h.id]?.[today]?.v ?? 0) >= Math.max(1, h.dailyTarget);
          if (!met && !skip.has(h.id)) {
            if (h.kind === "quit") {
              // leave unmarked = clean
            } else {
              get().setDayValue(h.id, today, h.dailyTarget);
            }
            completedIds.push(h.id);
          } else if (met) {
            completedIds.push(h.id);
          }
        }
        const score = computeCierreScore(get().habits, get().entries, today);
        const cierre: Cierre = {
          closedAt: new Date().toISOString(),
          score,
          note: note?.trim() || undefined,
          intention: intention?.trim() || undefined,
          completedIds,
          skippedIds: skipIds,
        };
        set({
          cierres: { ...get().cierres, [today]: cierre },
          screen: { t: "home" },
          toast: `Ritmo del día: ${score}%`,
        });
      },
      resetAll: () => set({ ...empty, settings: { ...DEFAULT_SETTINGS }, screen: { t: "home" } }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return globalThis.localStorage?.getItem(name) ?? null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            globalThis.localStorage?.setItem(name, value);
          } catch {
            /* ignore quota */
          }
        },
        removeItem: (name) => {
          try {
            globalThis.localStorage?.removeItem(name);
          } catch {
            /* ignore */
          }
        },
      })),
      partialize: (s) => ({
        habits: s.habits,
        entries: s.entries,
        cierres: s.cierres,
        settings: s.settings,
      }),
      skipHydration: true,
    },
  ),
);
