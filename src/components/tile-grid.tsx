import { useMemo } from "react";
import { addDays, startOfWeek, todayISO } from "@/lib/ritmo/dates";
import { createdDate, entryValue, isDayMet, type EntriesMap } from "@/lib/ritmo/streaks";
import type { Habit, WeekStart } from "@/lib/ritmo/types";
import { cn } from "@/lib/utils";

export function TileGrid({
  habit,
  entries,
  weeks,
  cell,
  gap = 2,
  weekStartsOn,
  asOf,
  interactive = false,
  onTapDay,
  onHoldDay,
}: {
  habit: Habit;
  entries: EntriesMap;
  weeks: number;
  cell: number;
  gap?: number;
  weekStartsOn: WeekStart;
  asOf?: string;
  interactive?: boolean;
  onTapDay?: (iso: string) => void;
  onHoldDay?: (iso: string) => void;
}) {
  const today = asOf ?? todayISO();
  const created = createdDate(habit);

  const columns = useMemo(() => {
    const end = startOfWeek(today, weekStartsOn);
    const start = addDays(end, -(weeks - 1) * 7);
    const cols: string[][] = [];
    for (let w = 0; w < weeks; w++) {
      const col: string[] = [];
      const origin = addDays(start, w * 7);
      for (let r = 0; r < 7; r++) col.push(addDays(origin, r));
      cols.push(col);
    }
    return cols;
  }, [today, weekStartsOn, weeks]);

  return (
    <div className="flex" style={{ gap }} aria-label={`Grilla de ${habit.name}`}>
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col" style={{ gap }}>
          {col.map((iso) => {
            const future = iso > today;
            const before = iso < created;
            const met = !future && !before && isDayMet(habit, iso, entries, today);
            const v = entryValue(entries, habit.id, iso);
            const isToday = iso === today;
            const slip = habit.kind === "quit" && v > 0 && !future && !before;
            const intensity =
              habit.tracking === "count" && met
                ? Math.min(1, 0.55 + (v / Math.max(habit.dailyTarget, 1)) * 0.45)
                : 1;
            const holdTimer = { id: 0 as number };
            const commonStyle = {
              width: cell,
              height: cell,
              background:
                future
                  ? "transparent"
                  : slip
                    ? "color-mix(in oklab, var(--rg-danger) 55%, transparent)"
                    : met
                      ? hexAlpha(habit.color, intensity)
                      : isToday
                        ? "transparent"
                        : "color-mix(in oklab, var(--rg-fg) 10%, transparent)",
              outline: isToday && !met ? `1.5px solid ${habit.color}` : "none",
              outlineOffset: 0,
              opacity: future ? 0.2 : 1,
            } as const;
            if (!interactive) {
              return <span key={iso} className="block rounded-[2px]" style={commonStyle} />;
            }
            return (
              <button
                key={iso}
                type="button"
                disabled={future}
                aria-label={`${iso}${met ? " completado" : ""}`}
                onPointerDown={() => {
                  holdTimer.id = window.setTimeout(() => onHoldDay?.(iso), 450);
                }}
                onPointerUp={() => window.clearTimeout(holdTimer.id)}
                onPointerLeave={() => window.clearTimeout(holdTimer.id)}
                onClick={() => onTapDay?.(iso)}
                className={cn(
                  "rounded-[2px] border-0 p-0",
                  !future && !before ? "cursor-pointer" : "cursor-default",
                )}
                style={commonStyle}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function hexAlpha(hex: string, a: number): string {
  const n = Math.round(Math.min(1, Math.max(0, a)) * 255);
  return `${hex}${n.toString(16).padStart(2, "0")}`;
}
