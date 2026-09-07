import { useMemo, useState } from "react";
import { CheckRing } from "@/components/check-ring";
import { TileGrid } from "@/components/tile-grid";
import { Button } from "@/components/ui/button";
import {
  addDays,
  eachDay,
  endOfMonth,
  formatLong,
  monthLabel,
  startOfMonth,
  todayISO,
  weekdayLabels,
} from "@/lib/ritmo/dates";
import {
  completionRate,
  computeStreaks,
  createdDate,
  entryNote,
  entryValue,
  isDayMet,
  recentTrend,
} from "@/lib/ritmo/streaks";
import type { EntriesMap } from "@/lib/ritmo/streaks";
import type { Habit, WeekStart } from "@/lib/ritmo/types";
import { cn } from "@/lib/utils";
import { Archive, ChevronLeft, ChevronRight, Pencil, Share2, Trash2 } from "lucide-react";

export function HabitDetail({
  habit,
  entries,
  weekStartsOn,
  onBack,
  onEdit,
  onArchive,
  onDelete,
  onShare,
  onToggleDay,
  onHoldDay,
  noteDraft,
}: {
  habit: Habit;
  entries: EntriesMap;
  weekStartsOn: WeekStart;
  onBack: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onShare: () => void;
  onToggleDay: (iso: string) => void;
  onHoldDay: (iso: string) => void;
  noteDraft?: { date: string } | null;
}) {
  const today = todayISO();
  const [month, setMonth] = useState(startOfMonth(today));
  const streaks = computeStreaks(habit, entries, today, weekStartsOn);
  const rate = completionRate(habit, entries, today);
  const trend = recentTrend(habit, entries, today, 14);
  const value = entryValue(entries, habit.id, today);
  const met = isDayMet(habit, today, entries, today);
  const labels = weekdayLabels(weekStartsOn);

  const monthDays = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const pad = eachDay(addDays(start, -((new Date(start + "T12:00:00").getDay() - weekStartsOn + 7) % 7)), addDays(start, -1));
    return { days: eachDay(start, end), pad: start === pad[0] ? [] : pad.filter((d) => d < start) };
  }, [month, weekStartsOn]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-1 px-2 pt-[max(10px,env(safe-area-inset-top))] pb-2">
        <button type="button" onClick={onBack} className="size-11 grid place-items-center" aria-label="Volver">
          <ChevronLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl tracking-tight">
            <span className="mr-1.5">{habit.emoji}</span>
            {habit.name}
          </h1>
          {habit.description ? <p className="truncate text-[12px] text-muted">{habit.description}</p> : null}
        </div>
        <CheckRing habit={habit} value={value} met={met} onToggle={() => onToggleDay(today)} size={44} />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-28 no-scrollbar">
        <div className="grid grid-cols-4 gap-2 mt-2">
          <Stat label="Racha" value={String(streaks.current)} />
          <Stat label="Mejor" value={String(streaks.best)} />
          <Stat label="Tasa" value={`${Math.round(rate.rate * 100)}%`} />
          <Stat label="Días" value={String(rate.completed)} />
        </div>
        <p className="mt-2 text-[11px] text-subtle">
          Tasa = días cumplidos / días desde que nació el hábito (hoy inclusive). Vacío = 0%.
        </p>

        <p className="mt-5 mb-2 text-xs font-medium text-muted">Año en azulejos</p>
        <div className="overflow-x-auto no-scrollbar pb-1">
          <TileGrid
            habit={habit}
            entries={entries}
            weeks={26}
            cell={9}
            gap={2}
            weekStartsOn={weekStartsOn}
            interactive
            onTapDay={onToggleDay}
            onHoldDay={onHoldDay}
          />
        </div>

        <p className="mt-5 mb-2 text-xs font-medium text-muted">Tendencia (14 días)</p>
        <div className="flex items-end gap-1 h-16">
          {trend.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: v ? "100%" : "12%",
                background: v ? habit.color : "color-mix(in oklab, var(--rg-fg) 10%, transparent)",
              }}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button type="button" className="size-10 grid place-items-center" onClick={() => setMonth(startOfMonth(addDays(month, -1)))}>
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="font-display text-lg tracking-tight">{monthLabel(month)}</h2>
          <button type="button" className="size-10 grid place-items-center" onClick={() => setMonth(startOfMonth(addDays(endOfMonth(month), 1)))}>
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {labels.map((l, i) => (
            <div key={i} className="text-center text-[10px] text-subtle py-1">
              {l}
            </div>
          ))}
          {Array.from({ length: (new Date(month + "T12:00:00").getDay() - weekStartsOn + 7) % 7 }).map((_, i) => (
            <div key={`p${i}`} />
          ))}
          {monthDays.days.map((iso) => {
            const future = iso > today;
            const dayMet = !future && isDayMet(habit, iso, entries, today);
            const note = entryNote(entries, habit.id, iso);
            const slip = habit.kind === "quit" && entryValue(entries, habit.id, iso) > 0;
            return (
              <button
                key={iso}
                type="button"
                disabled={future}
                onClick={() => onToggleDay(iso)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onHoldDay(iso);
                }}
                className={cn(
                  "aspect-square rounded-md text-[12px] font-medium relative",
                  future ? "text-subtle" : "text-fg",
                )}
                style={{
                  background: dayMet ? habit.color : "var(--rg-elevated)",
                  color: dayMet ? "#121110" : undefined,
                  outline: iso === today ? `1.5px solid ${habit.color}` : undefined,
                }}
              >
                {parseInt(iso.slice(8), 10)}
                {note ? <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-current opacity-60" /> : null}
                {slip ? <span className="absolute inset-0 grid place-items-center text-[10px]">!</span> : null}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-subtle">Toca un día para editar el historial. Mantén presionado para una nota.</p>
        {noteDraft ? (
          <p className="mt-1 text-[12px] text-muted">{formatLong(noteDraft.date)}</p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onEdit}>
            <Pencil className="size-4" /> Editar
          </Button>
          <Button variant="secondary" onClick={onShare}>
            <Share2 className="size-4" /> Compartir
          </Button>
          <Button variant="secondary" onClick={onArchive}>
            <Archive className="size-4" /> Archivar
          </Button>
          <Button variant="danger" onClick={onDelete}>
            <Trash2 className="size-4" /> Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-elevated px-2 py-2.5 text-center">
      <div className="font-display text-lg tabular-nums tracking-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-subtle">{label}</div>
    </div>
  );
}
