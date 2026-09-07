import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { computeCierreScore, hiloLength, pendingToday } from "@/lib/ritmo/cierre";
import { todayISO } from "@/lib/ritmo/dates";
import { isDayMet } from "@/lib/ritmo/streaks";
import type { EntriesMap } from "@/lib/ritmo/streaks";
import type { Cierre, Habit } from "@/lib/ritmo/types";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

export function CierreView({
  habits,
  entries,
  cierres,
  onBack,
  onClose,
}: {
  habits: Habit[];
  entries: EntriesMap;
  cierres: Record<string, Cierre>;
  onBack: () => void;
  onClose: (input: { note?: string; intention?: string; skipIds: string[] }) => void;
}) {
  const today = todayISO();
  const active = habits.filter((h) => !h.archived);
  const pending = pendingToday(active, entries, today);
  const [skip, setSkip] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState(cierres[today]?.note ?? "");
  const [intention, setIntention] = useState(cierres[today]?.intention ?? "");

  const preview = useMemo(() => {
    const skipIds = Object.entries(skip)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const remaining = pending.filter((h) => !skip[h.id]).length;
    const met = active.length - remaining;
    const score = active.length === 0 ? 0 : Math.round((met / active.length) * 100);
    return { score, remaining, skipIds };
  }, [active.length, pending, skip]);

  const hilo = hiloLength(cierres, today);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-1 px-2 pt-[max(10px,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} className="size-11 grid place-items-center" aria-label="Volver">
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="font-display text-xl tracking-tight">Cierre de Ritmo</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-28 no-scrollbar">
        <p className="mt-1 text-sm text-muted leading-relaxed">
          Un solo gesto para no dejar azulejos sueltos. Completa lo que sí hiciste, salta lo que no, y cierra el día.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-elevated px-3 py-3">
            <div className="font-display text-2xl tabular-nums">{preview.score}%</div>
            <div className="text-[11px] uppercase tracking-wide text-subtle">Ritmo de hoy</div>
          </div>
          <div className="rounded-lg bg-elevated px-3 py-3">
            <div className="font-display text-2xl tabular-nums">{hilo}</div>
            <div className="text-[11px] uppercase tracking-wide text-subtle">Hilo de cierres</div>
          </div>
        </div>

        <h2 className="mt-6 text-xs font-medium uppercase tracking-wide text-subtle">Hábitos de hoy</h2>
        <div className="mt-2 space-y-2">
          {active.map((h) => {
            const met = isDayMet(h, today, entries, today);
            const skipped = !!skip[h.id];
            return (
              <div key={h.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3">
                <span className="text-lg" aria-hidden>
                  {h.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{h.name}</p>
                  <p className="text-[11px] text-subtle">
                    {met ? "Ya está" : skipped ? "Se salta hoy" : "Pendiente"}
                  </p>
                </div>
                {!met ? (
                  <button
                    type="button"
                    onClick={() => setSkip((s) => ({ ...s, [h.id]: !s[h.id] }))}
                    className={cn(
                      "h-9 px-3 rounded-md text-xs font-medium",
                      skipped ? "bg-elevated text-muted" : "bg-accent text-accent-fg",
                    )}
                  >
                    {skipped ? "Deshacer salto" : "Saltar"}
                  </button>
                ) : (
                  <span className="text-xs text-[var(--rg-sage)]">Hecho</span>
                )}
              </div>
            );
          })}
        </div>

        <label className="mt-5 block text-xs font-medium text-muted mb-1.5">Nota del cierre (opcional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm resize-none outline-none"
          placeholder="Qué sostuvo el ritmo hoy."
        />
        <label className="mt-4 block text-xs font-medium text-muted mb-1.5">Intención de mañana</label>
        <input
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm outline-none"
          placeholder="Una cosa, no diez."
        />
      </div>
      <div className="absolute bottom-0 inset-x-0 p-4 pb-[max(16px,env(safe-area-inset-bottom))] bg-bg/90">
        <Button
          className="w-full"
          size="lg"
          onClick={() =>
            onClose({
              note,
              intention,
              skipIds: preview.skipIds,
            })
          }
        >
          Cerrar el día · {preview.score}%
        </Button>
      </div>
    </div>
  );
}

export function CierreBanner({
  habits,
  entries,
  cierres,
  onOpen,
}: {
  habits: Habit[];
  entries: EntriesMap;
  cierres: Record<string, Cierre>;
  onOpen: () => void;
}) {
  const today = todayISO();
  const closed = cierres[today];
  const pending = pendingToday(
    habits.filter((h) => !h.archived),
    entries,
    today,
  );
  const score = closed?.score ?? computeCierreScore(habits, entries, today);
  const hilo = hiloLength(cierres, today);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mx-4 mb-3 w-[calc(100%-2rem)] rounded-lg border border-border bg-surface px-3 py-3 text-left"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-sm">{closed ? "Ritmo cerrado" : "Cerrar el ritmo de hoy"}</p>
        <p className="font-mono text-xs tabular-nums text-muted">{score}%</p>
      </div>
      <p className="mt-1 text-[12px] text-subtle">
        {closed
          ? `Hilo ${hilo} día${hilo === 1 ? "" : "s"}. ${closed.intention ? `Mañana: ${closed.intention}` : "Toca para revisar."}`
          : pending.length === 0
            ? "Todo marcado. Cierra el día y guarda el hilo."
            : `${pending.length} pendiente${pending.length === 1 ? "" : "s"}. Diez segundos para no perder el hilo.`}
      </p>
      <HiloStrip cierres={cierres} />
    </button>
  );
}

function HiloStrip({ cierres }: { cierres: Record<string, Cierre> }) {
  const today = todayISO();
  const cells = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { iso, score: cierres[iso]?.score };
  });
  return (
    <div className="mt-2 flex gap-1" aria-hidden>
      {cells.map((c) => (
        <span
          key={c.iso}
          className="h-1.5 flex-1 rounded-full"
          style={{
            background:
              c.score == null
                ? "color-mix(in oklab, var(--rg-fg) 10%, transparent)"
                : `color-mix(in oklab, var(--rg-sage) ${Math.max(30, c.score)}%, transparent)`,
            outline: c.iso === today ? "1px solid var(--rg-fg)" : undefined,
          }}
        />
      ))}
    </div>
  );
}
