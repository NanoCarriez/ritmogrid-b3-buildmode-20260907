import { useEffect, useMemo, useState } from "react";
import { HabitCard } from "@/components/habit-card";
import { HabitDetail } from "@/components/habit-detail";
import { HabitForm } from "@/components/habit-form";
import { ProView } from "@/components/pro-view";
import { SettingsView } from "@/components/settings-view";
import { ShareView } from "@/components/share-view";
import { StatsView } from "@/components/stats-view";
import { CierreBanner, CierreView } from "@/components/cierre-view";
import { Button } from "@/components/ui/button";
import { STARTER_HABITS } from "@/lib/ritmo/palette";
import { todayISO } from "@/lib/ritmo/dates";
import { entryNote } from "@/lib/ritmo/streaks";
import { FREE_ACTIVE_LIMIT } from "@/lib/ritmo/types";
import { useRitmo } from "@/store/ritmo-store";
import { BarChart3, LayoutGrid, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function RitmoApp() {
  const hydrated = useRitmo((s) => s.hydrated);
  const setHydrated = useRitmo((s) => s.setHydrated);
  const habits = useRitmo((s) => s.habits);
  const entries = useRitmo((s) => s.entries);
  const settings = useRitmo((s) => s.settings);
  const screen = useRitmo((s) => s.screen);
  const toast = useRitmo((s) => s.toast);
  const setScreen = useRitmo((s) => s.setScreen);
  const setToast = useRitmo((s) => s.setToast);

  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) setHydrated();
    };
    try {
      const result = useRitmo.persist.rehydrate();
      void Promise.resolve(result).then(done).catch(done);
    } catch {
      done();
    }
    const fallback = window.setTimeout(done, 400);
    return () => {
      alive = false;
      window.clearTimeout(fallback);
    };
  }, [setHydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const apply = () => {
      const theme = useRitmo.getState().settings.theme;
      const dark =
        theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.dataset.theme = dark ? "dark" : "light";
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    const unsub = useRitmo.subscribe(apply);
    return () => {
      mq.removeEventListener("change", apply);
      unsub();
    };
  }, [hydrated]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast, setToast]);

  if (!hydrated) {
    return (
      <div className="min-h-dvh grid place-items-center bg-bg text-fg">
        <p className="font-display text-2xl tracking-tight">RitmoGrid</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bg text-fg overflow-x-hidden">
      <Screen />
      {toast ? (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-accent px-4 py-2 text-sm text-accent-fg">
          {toast}
        </div>
      ) : null}
      {screen.t === "home" || screen.t === "stats" || screen.t === "settings" ? <BottomNav /> : null}
    </div>
  );
}

function Screen() {
  const screen = useRitmo((s) => s.screen);
  const habits = useRitmo((s) => s.habits);
  const entries = useRitmo((s) => s.entries);
  const settings = useRitmo((s) => s.settings);
  const cierres = useRitmo((s) => s.cierres);
  const setScreen = useRitmo((s) => s.setScreen);

  if (screen.t === "form") {
    const initial = screen.id ? habits.find((h) => h.id === screen.id) : undefined;
    return (
      <div className="relative flex min-h-dvh flex-col">
        <HabitForm
          initial={initial}
          onCancel={() => setScreen(initial ? { t: "detail", id: initial.id } : { t: "home" })}
          onSave={(draft) => {
            if (draft.id) {
              useRitmo.getState().updateHabit(draft.id, draft);
              setScreen({ t: "detail", id: draft.id });
            } else {
              const res = useRitmo.getState().addHabit(draft);
              if (!res.ok) {
                setScreen({ t: "pro", reason: "El plan libre cubre 3 hábitos activos. Archiva uno o abre Pro." });
                return;
              }
              setScreen({ t: "home" });
              useRitmo.getState().setToast("Hábito listo. Toca el anillo para el primer azulejo.");
            }
          }}
        />
      </div>
    );
  }

  if (screen.t === "detail") {
    const habit = habits.find((h) => h.id === screen.id);
    if (!habit) return <Home />;
    return (
      <div className="flex min-h-dvh flex-col">
        <HabitDetail
          habit={habit}
          entries={entries}
          weekStartsOn={settings.weekStartsOn}
          onBack={() => setScreen({ t: "home" })}
          onEdit={() => setScreen({ t: "form", id: habit.id })}
          onArchive={() => {
            useRitmo.getState().archiveHabit(habit.id);
            useRitmo.getState().setToast("Hábito archivado. El historial se conserva.");
          }}
          onDelete={() => {
            if (window.confirm(`¿Eliminar «${habit.name}» y su historial?`)) {
              useRitmo.getState().deleteHabit(habit.id);
            }
          }}
          onShare={() => setScreen({ t: "share", id: habit.id })}
          onToggleDay={(iso) => useRitmo.getState().toggleDay(habit.id, iso)}
          onHoldDay={(iso) => setScreen({ t: "note", id: habit.id, date: iso })}
        />
      </div>
    );
  }

  if (screen.t === "note") {
    return <NoteSheet id={screen.id} date={screen.date} />;
  }

  if (screen.t === "stats") {
    return (
      <StatsView
        habits={habits}
        entries={entries}
        weekStartsOn={settings.weekStartsOn}
        pro={settings.proPreview}
        onPro={() => setScreen({ t: "pro" })}
      />
    );
  }

  if (screen.t === "settings") {
    return (
      <SettingsView
        settings={settings}
        archivedCount={habits.filter((h) => h.archived).length}
        activeCount={habits.filter((h) => !h.archived).length}
        onPatch={(p) => useRitmo.getState().patchSettings(p)}
        onArchive={() => setScreen({ t: "archive" })}
        onPro={() => setScreen({ t: "pro" })}
        onExport={() => {
          const json = useRitmo.getState().exportJson();
          const blob = new Blob([json], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `ritmogrid-${todayISO()}.json`;
          a.click();
          useRitmo.getState().setToast("Exportado.");
        }}
        onImport={(text) => {
          const res = useRitmo.getState().importJson(text);
          useRitmo.getState().setToast(res.ok ? "Importado." : res.error);
        }}
      />
    );
  }

  if (screen.t === "archive") return <ArchiveView />;

  if (screen.t === "pro") {
    return (
      <ProView
        pro={settings.proPreview}
        reason={screen.reason}
        onBack={() => setScreen({ t: "home" })}
        onToggleDemo={(on) => {
          useRitmo.getState().setProPreview(on);
          useRitmo.getState().setToast(on ? "Vista Pro activa (demo)." : "Volviste al plan libre. Nada se borró.");
        }}
      />
    );
  }

  if (screen.t === "share") {
    const habit = habits.find((h) => h.id === screen.id);
    if (!habit) return <Home />;
    return (
      <ShareView
        habit={habit}
        entries={entries}
        weekStartsOn={settings.weekStartsOn}
        pro={settings.proPreview}
        onBack={() => setScreen({ t: "detail", id: habit.id })}
        onPro={() => setScreen({ t: "pro" })}
      />
    );
  }

  if (screen.t === "cierre") {
    return (
      <div className="relative flex min-h-dvh flex-col">
        <CierreView
          habits={habits}
          entries={entries}
          cierres={cierres}
          onBack={() => setScreen({ t: "home" })}
          onClose={(input) => useRitmo.getState().closeRitmo(input)}
        />
      </div>
    );
  }

  return <Home />;
}

function Home() {
  const habits = useRitmo((s) => s.habits);
  const entries = useRitmo((s) => s.entries);
  const settings = useRitmo((s) => s.settings);
  const cierres = useRitmo((s) => s.cierres);
  const setScreen = useRitmo((s) => s.setScreen);
  const [reorder, setReorder] = useState(false);
  const active = useMemo(
    () => habits.filter((h) => !h.archived).sort((a, b) => a.order - b.order),
    [habits],
  );
  const due = useDueReminders(active);

  if (active.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-24">
      <header className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">RitmoGrid</p>
          <h1 className="font-display text-[28px] leading-tight tracking-tight">Hoy</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setReorder((v) => !v)}
            className={cn("h-9 px-3 rounded-md text-xs font-medium", reorder ? "bg-accent text-accent-fg" : "bg-elevated")}
          >
            Ordenar
          </button>
          <button
            type="button"
            onClick={() => {
              if (!useRitmo.getState().canAddActive()) {
                setScreen({ t: "pro", reason: "El plan libre cubre 3 hábitos activos." });
                return;
              }
              setScreen({ t: "form" });
            }}
            className="size-11 grid place-items-center rounded-md bg-accent text-accent-fg"
            aria-label="Nuevo hábito"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </header>

      <div className="px-4 flex gap-1 mb-3">
        {(["grid", "compact", "list"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => useRitmo.getState().patchSettings({ viewMode: m })}
            className={cn(
              "h-8 px-3 rounded-full text-[11px] font-medium",
              settings.viewMode === m ? "bg-elevated text-fg" : "text-muted",
            )}
          >
            {m === "grid" ? "Cuadrícula" : m === "compact" ? "Compacto" : "Lista"}
          </button>
        ))}
      </div>

      {due.length > 0 ? (
        <div className="mx-4 mb-3 rounded-md bg-elevated px-3 py-2 text-[12px] text-muted">
          Aviso pendiente: {due.map((h) => h.name).join(", ")}
        </div>
      ) : null}

      <CierreBanner
        habits={habits}
        entries={entries}
        cierres={cierres}
        onOpen={() => setScreen({ t: "cierre" })}
      />

      {!settings.proPreview && active.length >= FREE_ACTIVE_LIMIT ? (
        <button
          type="button"
          onClick={() => setScreen({ t: "pro" })}
          className="mx-4 mb-3 text-left rounded-md border border-border px-3 py-2 text-[12px] text-muted"
        >
          Límite libre: {FREE_ACTIVE_LIMIT} hábitos activos. Toca para ver Pro.
        </button>
      ) : null}

      <div className="px-4 space-y-2.5">
        {active.map((h) => (
          <HabitCard
            key={h.id}
            habit={h}
            entries={entries}
            viewMode={settings.viewMode}
            weekStartsOn={settings.weekStartsOn}
            weeks={settings.proPreview ? settings.gridWeeks : 16}
            reorder={reorder}
            onOpen={() => setScreen({ t: "detail", id: h.id })}
            onToggle={() => useRitmo.getState().toggleDay(h.id, todayISO())}
            onBump={(d) => useRitmo.getState().bumpDay(h.id, todayISO(), d)}
            onMove={(dir) => useRitmo.getState().moveHabit(h.id, dir)}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  const setScreen = useRitmo((s) => s.setScreen);
  return (
    <div className="flex min-h-dvh flex-col px-5 pt-[max(48px,env(safe-area-inset-top))] pb-10">
      <p className="text-[11px] uppercase tracking-[0.22em] text-subtle">RitmoGrid</p>
      <h1 className="mt-3 font-display text-[40px] leading-[1.05] tracking-tight">Haz visible la constancia.</h1>
      <p className="mt-3 text-[15px] text-muted leading-relaxed">
        Un toque llena un azulejo. La grilla crece. La racha se entiende de un vistazo. Empieza con uno — el primero es
        el que cuenta.
      </p>
      <div className="mt-8 space-y-2">
        {STARTER_HABITS.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => {
              useRitmo.getState().addHabit({
                name: s.name,
                emoji: s.emoji,
                color: s.color,
                description: s.description,
                tracking: s.tracking,
                dailyTarget: s.dailyTarget,
              });
              useRitmo.getState().setToast("Listo. Toca el anillo de hoy.");
            }}
            className="flex w-full items-center gap-3 rounded-lg bg-surface border border-border px-3 py-3 text-left"
          >
            <span
              className="size-10 grid place-items-center rounded-md text-lg"
              style={{ background: s.color, color: "#121110" }}
            >
              {s.emoji}
            </span>
            <span>
              <span className="block font-medium">{s.name}</span>
              <span className="block text-[12px] text-muted">{s.description}</span>
            </span>
          </button>
        ))}
      </div>
      <Button
        className="mt-6 w-full"
        size="lg"
        onClick={() => setScreen({ t: "form" })}
      >
        Crear el mío
      </Button>
    </div>
  );
}

function ArchiveView() {
  const habits = useRitmo((s) => s.habits.filter((h) => h.archived));
  const setScreen = useRitmo((s) => s.setScreen);
  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-10">
      <button type="button" onClick={() => setScreen({ t: "settings" })} className="text-sm text-muted mb-3">
        Volver
      </button>
      <h1 className="font-display text-3xl tracking-tight">Archivo</h1>
      {habits.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nada archivado. El historial de un hábito se conserva al archivarlo.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {habits.map((h) => (
            <div key={h.id} className="rounded-lg bg-surface border border-border px-3 py-3 flex items-center gap-3">
              <span>{h.emoji}</span>
              <span className="flex-1 font-medium text-sm">{h.name}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const res = useRitmo.getState().restoreHabit(h.id);
                  if (!res.ok) {
                    setScreen({ t: "pro", reason: "Para restaurar con 3 hábitos activos, abre Pro o archiva otro." });
                    return;
                  }
                  useRitmo.getState().setToast("Restaurado.");
                }}
              >
                Restaurar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteSheet({ id, date }: { id: string; date: string }) {
  const note = useRitmo((s) => entryNote(s.entries, id, date));
  const [text, setText] = useState(note);
  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(16px,env(safe-area-inset-top))]">
      <h1 className="font-display text-2xl tracking-tight">Nota del día</h1>
      <p className="text-sm text-muted mt-1">{date}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="mt-4 w-full rounded-lg border border-border bg-elevated p-3 text-sm outline-none"
        placeholder="Qué salió bien, o qué se interpuso."
        autoFocus
      />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => useRitmo.getState().setScreen({ t: "detail", id })}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            useRitmo.getState().setDayNote(id, date, text);
            useRitmo.getState().setScreen({ t: "detail", id });
          }}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}

function BottomNav() {
  const screen = useRitmo((s) => s.screen);
  const setScreen = useRitmo((s) => s.setScreen);
  const items = [
    { t: "home" as const, label: "Hoy", icon: LayoutGrid },
    { t: "stats" as const, label: "Stats", icon: BarChart3 },
    { t: "settings" as const, label: "Ajustes", icon: Settings },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] border-t border-border bg-bg/95 backdrop-blur-sm">
      <div className="grid grid-cols-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-1">
        {items.map((it) => {
          const Icon = it.icon;
          const on = screen.t === it.t;
          return (
            <button
              key={it.t}
              type="button"
              onClick={() => setScreen({ t: it.t })}
              className={cn("h-14 flex flex-col items-center justify-center gap-0.5 text-[11px]", on ? "text-fg" : "text-subtle")}
            >
              <Icon className="size-5" strokeWidth={on ? 2.2 : 1.8} />
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function useDueReminders(habits: { id: string; name: string; reminderTimes: string[] }[]) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  const today = todayISO();
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const entries = useRitmo((s) => s.entries);
  return habits.filter((h) => {
    if (h.reminderTimes.length === 0) return false;
    const v = entries[h.id]?.[today]?.v ?? 0;
    if (v > 0) return false;
    return h.reminderTimes.some((t) => t <= hhmm);
  });
}
