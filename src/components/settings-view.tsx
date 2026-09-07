import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { FREE_ACTIVE_LIMIT, type Settings, type WeekStart } from "@/lib/ritmo/types";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export function SettingsView({
  settings,
  archivedCount,
  activeCount,
  onPatch,
  onArchive,
  onPro,
  onExport,
  onImport,
}: {
  settings: Settings;
  archivedCount: number;
  activeCount: number;
  onPatch: (p: Partial<Settings>) => void;
  onArchive: () => void;
  onPro: () => void;
  onExport: () => void;
  onImport: (text: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pro = settings.proPreview;

  return (
    <div className="px-4 pt-[max(16px,env(safe-area-inset-top))] pb-28">
      <h1 className="font-display text-3xl tracking-tight">Ajustes</h1>
      <p className="text-sm text-muted mt-1">RitmoGrid guarda todo en este dispositivo. Sin cuenta.</p>

      <Section title="Apariencia">
        <Seg
          value={settings.theme}
          options={[
            { v: "dark", l: "Oscuro" },
            { v: "light", l: "Claro" },
            { v: "system", l: "Sistema" },
          ]}
          onChange={(theme) => onPatch({ theme: theme as Settings["theme"] })}
        />
      </Section>

      <Section title="Inicio de semana">
        <Seg
          value={String(settings.weekStartsOn)}
          options={[
            { v: "1", l: "Lunes" },
            { v: "0", l: "Domingo" },
            { v: "3", l: "Miércoles" },
          ]}
          onChange={(v) => onPatch({ weekStartsOn: Number(v) as WeekStart })}
        />
      </Section>

      <Section title="Densidad de grilla">
        <Seg
          value={settings.viewMode}
          options={[
            { v: "grid", l: "Cuadrícula" },
            { v: "compact", l: "Compacto" },
            { v: "list", l: "Lista" },
          ]}
          onChange={(viewMode) => onPatch({ viewMode: viewMode as Settings["viewMode"] })}
        />
        {pro ? (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>Semanas visibles</span>
              <span className="font-mono">{settings.gridWeeks}</span>
            </div>
            <input
              type="range"
              min={10}
              max={22}
              value={settings.gridWeeks}
              onChange={(e) => onPatch({ gridWeeks: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-subtle">La densidad extra de la grilla es Pro.</p>
        )}
      </Section>

      <Section title="Datos">
        <Row label={`Archivo (${archivedCount})`} onClick={onArchive} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            disabled={!pro}
            onClick={onExport}
          >
            Exportar JSON
          </Button>
          <Button
            variant="secondary"
            disabled={!pro}
            onClick={() => fileRef.current?.click()}
          >
            Importar
          </Button>
        </div>
        {!pro ? (
          <p className="mt-2 text-[12px] text-subtle">Exportar e importar son parte de Pro. Tus datos no se tocan.</p>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            onImport(await f.text());
          }}
        />
      </Section>

      <Section title="Plan">
        <div className="rounded-lg bg-surface border border-border p-4">
          <p className="font-medium">{pro ? "Vista Pro (demo)" : "Plan libre"}</p>
          <p className="text-sm text-muted mt-1">
            {pro
              ? "Hábitos ilimitados, stats avanzadas, exportar y compartir."
              : `${activeCount}/${FREE_ACTIVE_LIMIT} hábitos activos. El plan libre sigue siendo útil.`}
          </p>
          <Button className="mt-3 w-full" variant={pro ? "secondary" : "primary"} onClick={onPro}>
            {pro ? "Gestionar vista Pro" : "Ver RitmoGrid Pro"}
          </Button>
        </div>
      </Section>

      <p className="mt-8 text-[11px] text-subtle leading-relaxed">
        RitmoGrid es un producto original. No usa la marca, el código ni los textos de otras apps. Los datos viven en
        este navegador (localStorage).
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-xs font-medium uppercase tracking-wide text-subtle mb-2">{title}</h2>
      {children}
    </section>
  );
}

function Seg({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1 rounded-md bg-elevated p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn("h-9 rounded-sm text-xs font-medium", value === o.v ? "bg-surface text-fg" : "text-muted")}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Row({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-between rounded-md bg-elevated px-3 text-sm"
    >
      {label}
      <ChevronRight className="size-4 text-subtle" />
    </button>
  );
}
