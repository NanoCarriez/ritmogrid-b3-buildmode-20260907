import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { HABIT_COLORS, EMOJI_SET, searchEmoji } from "@/lib/ritmo/palette";
import type { FrequencyKind, Habit, HabitKind, TrackingMode } from "@/lib/ritmo/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function HabitForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Habit;
  onCancel: () => void;
  onSave: (draft: Omit<Habit, "id" | "order" | "archived" | "createdAt"> & Partial<Pick<Habit, "id">>) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "✦");
  const [color, setColor] = useState(initial?.color ?? HABIT_COLORS[0]);
  const [kind, setKind] = useState<HabitKind>(initial?.kind ?? "build");
  const [tracking, setTracking] = useState<TrackingMode>(initial?.tracking ?? "check");
  const [dailyTarget, setDailyTarget] = useState(initial?.dailyTarget ?? 1);
  const [frequencyKind, setFrequencyKind] = useState<FrequencyKind>(initial?.frequencyKind ?? "daily");
  const [frequencyTarget, setFrequencyTarget] = useState(initial?.frequencyTarget ?? 1);
  const [reminderTimes, setReminderTimes] = useState<string[]>(initial?.reminderTimes ?? []);
  const [q, setQ] = useState("");
  const emojis = useMemo(() => (q.trim() ? searchEmoji(q) : EMOJI_SET.flatMap((c) => c.items)), [q]);

  function addReminder() {
    if (reminderTimes.length >= 3) return;
    setReminderTimes([...reminderTimes, "20:00"]);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3">
        <button type="button" onClick={onCancel} className="size-11 grid place-items-center rounded-md" aria-label="Cerrar">
          <X className="size-5" />
        </button>
        <h1 className="font-display text-xl tracking-tight">{initial ? "Editar hábito" : "Nuevo hábito"}</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-28 no-scrollbar">
        <label className="block text-xs font-medium text-muted mb-1.5">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Caminar"
          className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-[15px] outline-none focus:ring-1 focus:ring-accent"
          autoFocus
        />
        <label className="mt-4 block text-xs font-medium text-muted mb-1.5">Descripción (opcional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-elevated px-3 py-2 text-[14px] outline-none focus:ring-1 focus:ring-accent resize-none"
        />

        <p className="mt-5 text-xs font-medium text-muted mb-2">Símbolo</p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar"
          className="h-10 w-full rounded-md border border-border bg-elevated px-3 text-sm outline-none mb-2"
        />
        <div className="flex flex-wrap gap-1.5">
          {emojis.slice(0, 48).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={cn(
                "size-10 grid place-items-center rounded-sm text-lg",
                emoji === e ? "bg-elevated ring-1 ring-accent" : "bg-surface",
              )}
            >
              {e}
            </button>
          ))}
        </div>

        <p className="mt-5 text-xs font-medium text-muted mb-2">Color</p>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="size-8 rounded-full"
              style={{
                background: c,
                boxShadow: color === c ? `0 0 0 2px var(--rg-bg), 0 0 0 4px ${c}` : "none",
              }}
              aria-label={c}
            />
          ))}
        </div>

        <p className="mt-5 text-xs font-medium text-muted mb-2">Tipo</p>
        <div className="grid grid-cols-2 gap-2">
          <Chip on={() => setKind("build")} active={kind === "build"} label="Construir" />
          <Chip on={() => setKind("quit")} active={kind === "quit"} label="Dejar" />
        </div>
        <p className="mt-2 text-[12px] text-subtle">
          {kind === "quit"
            ? "Cada día cuenta limpio hasta que marcas un desliz."
            : "Marcas los días en que lo hiciste."}
        </p>

        {kind === "build" ? (
          <>
            <p className="mt-5 text-xs font-medium text-muted mb-2">Registro</p>
            <div className="grid grid-cols-2 gap-2">
              <Chip on={() => { setTracking("check"); setDailyTarget(1); }} active={tracking === "check"} label="Un toque" />
              <Chip on={() => setTracking("count")} active={tracking === "count"} label="Contador" />
            </div>
            {tracking === "count" ? (
              <NumberRow label="Meta diaria" value={dailyTarget} min={1} max={30} onChange={setDailyTarget} />
            ) : null}
          </>
        ) : null}

        <p className="mt-5 text-xs font-medium text-muted mb-2">Frecuencia de racha</p>
        <div className="grid grid-cols-3 gap-2">
          <Chip
            on={() => {
              setFrequencyKind("daily");
              setFrequencyTarget(1);
            }}
            active={frequencyKind === "daily"}
            label="Diario"
          />
          <Chip
            on={() => {
              setFrequencyKind("weekly");
              setFrequencyTarget(Math.max(frequencyTarget, 3));
            }}
            active={frequencyKind === "weekly"}
            label="Semanal"
          />
          <Chip
            on={() => {
              setFrequencyKind("monthly");
              setFrequencyTarget(Math.max(frequencyTarget, 10));
            }}
            active={frequencyKind === "monthly"}
            label="Mensual"
          />
        </div>
        {frequencyKind !== "daily" ? (
          <NumberRow
            label={frequencyKind === "weekly" ? "Veces por semana" : "Veces por mes"}
            value={frequencyTarget}
            min={1}
            max={frequencyKind === "weekly" ? 7 : 31}
            onChange={setFrequencyTarget}
          />
        ) : null}

        <p className="mt-5 text-xs font-medium text-muted mb-2">Avisos in-app (hasta 3)</p>
        <p className="text-[12px] text-subtle mb-2">
          En la web no hay notificaciones nativas. RitmoGrid te marca el aviso pendiente en el tablero.
        </p>
        <div className="space-y-2">
          {reminderTimes.map((t, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="time"
                value={t}
                onChange={(e) => {
                  const next = [...reminderTimes];
                  next[i] = e.target.value;
                  setReminderTimes(next);
                }}
                className="h-11 flex-1 rounded-md border border-border bg-elevated px-3"
              />
              <Button
                variant="ghost"
                onClick={() => setReminderTimes(reminderTimes.filter((_, j) => j !== i))}
              >
                Quitar
              </Button>
            </div>
          ))}
        </div>
        {reminderTimes.length < 3 ? (
          <Button variant="secondary" className="mt-2 w-full" onClick={addReminder}>
            Añadir aviso
          </Button>
        ) : null}
      </div>
      <div className="absolute bottom-0 inset-x-0 p-4 pb-[max(16px,env(safe-area-inset-bottom))] bg-bg/90 backdrop-blur-sm">
        <Button
          className="w-full"
          size="lg"
          disabled={!name.trim()}
          onClick={() =>
            onSave({
              id: initial?.id,
              name: name.trim(),
              description: description.trim(),
              emoji,
              color,
              kind,
              tracking: kind === "quit" ? "check" : tracking,
              dailyTarget: kind === "quit" ? 1 : dailyTarget,
              frequencyKind,
              frequencyTarget: frequencyKind === "daily" ? 1 : frequencyTarget,
              reminderTimes,
            })
          }
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}

function Chip({ active, label, on }: { active: boolean; label: string; on: () => void }) {
  return (
    <button
      type="button"
      onClick={on}
      className={cn(
        "h-10 rounded-md text-sm font-medium",
        active ? "bg-accent text-accent-fg" : "bg-elevated text-fg",
      )}
    >
      {label}
    </button>
  );
}

function NumberRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between rounded-md bg-elevated px-3 h-12">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" className="size-8 rounded-sm bg-surface" onClick={() => onChange(Math.max(min, value - 1))}>
          −
        </button>
        <span className="font-mono tabular-nums w-6 text-center">{value}</span>
        <button type="button" className="size-8 rounded-sm bg-surface" onClick={() => onChange(Math.min(max, value + 1))}>
          +
        </button>
      </div>
    </div>
  );
}
