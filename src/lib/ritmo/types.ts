export const EXPORT_SCHEMA = "ritmogrid.export.v1" as const;
export const STORAGE_KEY = "ritmogrid.v1";
export const FREE_ACTIVE_LIMIT = 3;

export type FrequencyKind = "daily" | "weekly" | "monthly";
export type HabitKind = "build" | "quit";
export type TrackingMode = "check" | "count";
export type ThemeMode = "dark" | "light" | "system";
export type ViewMode = "grid" | "compact" | "list";
export type WeekStart = 0 | 1 | 3;

export interface DayEntry {
  v: number;
  note?: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  kind: HabitKind;
  tracking: TrackingMode;
  dailyTarget: number;
  frequencyKind: FrequencyKind;
  frequencyTarget: number;
  archived: boolean;
  createdAt: string;
  order: number;
  reminderTimes: string[];
}

export interface Cierre {
  closedAt: string;
  score: number;
  note?: string;
  intention?: string;
  completedIds: string[];
  skippedIds: string[];
}

export interface Settings {
  theme: ThemeMode;
  weekStartsOn: WeekStart;
  viewMode: ViewMode;
  proPreview: boolean;
  onboarded: boolean;
  gridWeeks: number;
}

export interface RitmoState {
  habits: Habit[];
  entries: Record<string, Record<string, DayEntry>>;
  cierres: Record<string, Cierre>;
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  weekStartsOn: 1,
  viewMode: "grid",
  proPreview: false,
  onboarded: false,
  gridWeeks: 18,
};

export function defaultHabit(partial: Partial<Habit> & Pick<Habit, "name">): Habit {
  return {
    id: partial.id ?? "",
    name: partial.name,
    emoji: partial.emoji ?? "✦",
    color: partial.color ?? "#7F9A86",
    description: partial.description ?? "",
    kind: partial.kind ?? "build",
    tracking: partial.tracking ?? "check",
    dailyTarget: partial.dailyTarget ?? 1,
    frequencyKind: partial.frequencyKind ?? "daily",
    frequencyTarget: partial.frequencyTarget ?? 1,
    archived: partial.archived ?? false,
    createdAt: partial.createdAt ?? new Date().toISOString(),
    order: partial.order ?? 0,
    reminderTimes: partial.reminderTimes ?? [],
  };
}
