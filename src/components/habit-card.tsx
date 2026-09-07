import { TileGrid } from "@/components/tile-grid";
import { CheckRing } from "@/components/check-ring";
import { todayISO } from "@/lib/ritmo/dates";
import { computeStreaks, entryValue, formatStreak, isDayMet, periodProgress } from "@/lib/ritmo/streaks";
import type { EntriesMap } from "@/lib/ritmo/streaks";
import type { Habit, ViewMode, WeekStart } from "@/lib/ritmo/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

export function HabitCard({
  habit,
  entries,
  viewMode,
  weekStartsOn,
  weeks,
  reorder,
  onOpen,
  onToggle,
  onBump,
  onMove,
}: {
  habit: Habit;
  entries: EntriesMap;
  viewMode: ViewMode;
  weekStartsOn: WeekStart;
  weeks: number;
  reorder?: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onBump: (d: number) => void;
  onMove?: (dir: -1 | 1) => void;
}) {
  const today = todayISO();
  const value = entryValue(entries, habit.id, today);
  const met = isDayMet(habit, today, entries, today);
  const streaks = computeStreaks(habit, entries, today, weekStartsOn);
  const period = periodProgress(habit, entries, today, weekStartsOn);
  const compact = viewMode === "compact";
  const list = viewMode === "list";

  return (
    <article
      className={cn(
        "rounded-xl bg-surface border border-border overflow-hidden",
        list ? "px-3 py-2.5" : "p-3.5",
      )}
    >
      <div className="flex items-center gap-3">
        {reorder ? (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              className="size-8 grid place-items-center rounded-sm text-muted"
              onClick={() => onMove?.(-1)}
              aria-label="Subir"
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              className="size-8 grid place-items-center rounded-sm text-muted"
              onClick={() => onMove?.(1)}
              aria-label="Bajar"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] leading-none" aria-hidden>
              {habit.emoji}
            </span>
            <h2 className="truncate font-medium text-[15px] tracking-tight">{habit.name}</h2>
            <span className="ml-auto shrink-0 font-mono text-[11px] tabular-nums text-muted">
              {formatStreak(streaks)}
              {habit.frequencyKind !== "daily"
                ? ` · ${period.done}/${period.target}`
                : streaks.current > 0
                  ? " d"
                  : ""}
            </span>
          </div>
          {list ? (
            <div className="mt-2">
              <TileGrid
                habit={habit}
                entries={entries}
                weeks={1}
                cell={14}
                gap={4}
                weekStartsOn={weekStartsOn}
              />
            </div>
          ) : (
            <div className="mt-2.5 overflow-hidden">
              <TileGrid
                habit={habit}
                entries={entries}
                weeks={compact ? 12 : weeks}
                cell={compact ? 8 : 10}
                gap={compact ? 2 : 2.5}
                weekStartsOn={weekStartsOn}
              />
            </div>
          )}
        </button>
        <CheckRing
          habit={habit}
          value={value}
          met={met}
          onToggle={onToggle}
          onBump={onBump}
          size={list ? 44 : 52}
        />
      </div>
    </article>
  );
}
