import { Button } from "@/components/ui/button";
import { Check, ChevronLeft } from "lucide-react";

const PLANS = [
  { id: "month", name: "Mensual", price: "$1.990", period: "/mes", note: "Cancela cuando quieras" },
  { id: "year", name: "Anual", price: "$9.990", period: "/año", note: "El más elegido", featured: true },
  { id: "life", name: "De por vida", price: "$29.990", period: "un pago", note: "Sin renovación" },
];

const PERKS = [
  "Hábitos activos ilimitados",
  "Estadísticas avanzadas y tendencia semanal",
  "Exportar e importar JSON versionado",
  "Más densidad de grilla y personalización",
  "Tarjeta para compartir el progreso",
  "Historial del Cierre de Ritmo",
];

export function ProView({
  pro,
  reason,
  onBack,
  onToggleDemo,
}: {
  pro: boolean;
  reason?: string;
  onBack: () => void;
  onToggleDemo: (on: boolean) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-1 px-2 pt-[max(10px,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} className="size-11 grid place-items-center" aria-label="Volver">
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="font-display text-xl tracking-tight">RitmoGrid Pro</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-10 no-scrollbar">
        <p className="mt-2 font-display text-3xl tracking-tight leading-[1.15]">
          La constancia, sin techo.
        </p>
        <p className="mt-2 text-sm text-muted">
          El plan libre cubre 3 hábitos, la grilla y las rachas. Pro abre el resto, sin fingir un cobro.
        </p>
        {reason ? <p className="mt-3 rounded-md bg-elevated px-3 py-2 text-sm">{reason}</p> : null}

        <ul className="mt-5 space-y-2">
          {PERKS.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <Check className="size-4 mt-0.5 shrink-0 text-[var(--rg-sage)]" />
              {p}
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-2">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-border bg-surface px-4 py-3 flex items-baseline gap-3"
              style={p.featured ? { outline: "1px solid var(--rg-accent)" } : undefined}
            >
              <div className="min-w-0">
                <p className="font-medium">{p.name}</p>
                <p className="text-[12px] text-subtle">{p.note}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-display text-xl tabular-nums">{p.price}</p>
                <p className="text-[11px] text-subtle">{p.period}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-border bg-elevated p-4">
          <p className="text-sm font-medium">Vista previa para evaluación</p>
          <p className="text-[12px] text-muted mt-1">
            Esto no es un pago. No hay transacción, ni recibo, ni desbloqueo fingido. Activa o desactiva la demo Pro
            para revisar el límite y las funciones.
          </p>
          <Button className="mt-3 w-full" variant={pro ? "secondary" : "primary"} onClick={() => onToggleDemo(!pro)}>
            {pro ? "Desactivar vista Pro (demo)" : "Activar vista Pro (demo)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
