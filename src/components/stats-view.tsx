import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { addDays, todayISO } from "@/lib/ritmo/dates";
import { completionRate, computeStreaks, isDayMet } from "@/lib/ritmo/streaks";
import type { EntriesMap } from "@/lib/ritmo/streaks";
import type { Habit, WeekStart } from "@/lib/ritmo/types";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StatsView({
  habits,
  entries,
  weekStartsOn,
  pro,
  onPro,
}: {
  habits: Habit[];
  entries: EntriesMap;
  weekStartsOn: WeekStart;
  pro: boolean;
  onPro: () => void;
}) {
  const today = todayISO();
  const active = habits.filter((h) => !h.archived);

  const cards = active.map((h) => {
    const s = computeStreaks(h, entries, today, weekStartsOn);
    const r = completionRate(h, entries, today);
    return { habit: h, s, r };
  });

  const weekData = useMemo(() => {
    const rows: { label: string; pct: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const end = addDays(today, -w * 7);
      const start = addDays(end, -6);
      let possible = 0;
      let met = 0;
      for (const h of active) {
        for (let i = 0; i < 7; i++) {
          const d = addDays(start, i);
          if (d > today) continue;
          if (d < h.createdAt.slice(0, 10)) continue;
          possible += 1;
          if (isDayMet(h, d, entries, today)) met += 1;
        }
      }
      rows.push({
        label: start.slice(5),
        pct: possible === 0 ? 0 : Math.round((met / possible) * 100),
      });
    }
    return rows;
  }, [active, entries, today]);

  const weekday = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    const totals = [0, 0, 0, 0, 0, 0, 0];
    for (const h of active) {
      for (let i = 0; i < 90; i++) {
        const d = addDays(today, -i);
        if (d < h.createdAt.slice(0, 10)) continue;
        const wd = new Date(d + "T12:00:00").getDay();
        totals[wd] += 1;
        if (isDayMet(h, d, entries, today)) buckets[wd] += 1;
      }
    }
    const names = ["D", "L", "M", "M", "J", "V", "S"];
    const order = [...Array(7)].map((_, i) => (weekStartsOn + i) % 7);
    return order.map((wd) => ({
      n: names[wd],
      pct: totals[wd] === 0 ? 0 : Math.round((buckets[wd] / totals[wd]) * 100),
    }));
  }, [active, entries, today, weekStartsOn]);

  if (active.length === 0) {
    return (
      <div className="px-5 pt-8">
        <h1 className="font-display text-3xl tracking-tight">Estadísticas</h1>
        <p className="mt-2 text-muted text-sm">Cuando tengas hábitos, aquí verás la constancia con números claros.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-28">
      <h1 className="font-display text-3xl tracking-tight">Estadísticas</h1>
      <p className="text-sm text-muted mt-1">La tasa usa todos los días desde que nació cada hábito.</p>

      <div className="mt-5 space-y-2">
        {cards.map(({ habit, s, r }) => (
          <div key={habit.id} className="rounded-lg bg-surface border border-border px-3 py-3">
            <div className="flex items-baseline gap-2">
              <span>{habit.emoji}</span>
              <span className="font-medium text-sm">{habit.name}</span>
              <span className="ml-auto font-mono text-xs tabular-nums text-muted">
                {Math.round(r.rate * 100)}%
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <Mini k="Racha" v={s.current} />
              <Mini k="Mejor" v={s.best} />
              <Mini k="Días" v={r.completed} />
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-6">
        <h2 className="font-display text-lg tracking-tight mb-3">Últimas 8 semanas</h2>
        <div className="h-44 rounded-lg bg-surface border border-border p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData}>
              <XAxis dataKey="label" tick={{ fill: "var(--rg-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Bar dataKey="pct" fill="var(--rg-sage)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {!pro ? (
          <div className="absolute inset-0 top-8 rounded-lg bg-bg/70 backdrop-blur-[2px] grid place-items-center">
            <div className="text-center px-6">
              <Lock className="size-5 mx-auto mb-2 text-muted" />
              <p className="text-sm font-medium">Estadísticas avanzadas</p>
              <p className="text-xs text-muted mt-1 mb-3">Gráfico semanal, mejor día y tendencia. Parte de Pro.</p>
              <Button size="sm" onClick={onPro}>
                Ver Pro
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <h2 className="font-display text-lg tracking-tight mb-3">Mejor día de la semana</h2>
            <div className="flex items-end gap-2 h-24">
              {weekday.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-[var(--rg-sage)]"
                    style={{ height: `${Math.max(8, d.pct)}%` }}
                  />
                  <span className="text-[10px] text-subtle">{d.n}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Mini({ k, v }: { k: string; v: number }) {
  return (
    <div>
      <div className="font-mono text-sm tabular-nums">{v}</div>
      <div className="text-[10px] text-subtle uppercase">{k}</div>
    </div>
  );
}
