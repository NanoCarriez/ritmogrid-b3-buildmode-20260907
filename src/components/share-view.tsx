import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { addDays, startOfWeek, todayISO } from "@/lib/ritmo/dates";
import { computeStreaks, createdDate, isDayMet } from "@/lib/ritmo/streaks";
import type { EntriesMap } from "@/lib/ritmo/streaks";
import type { Habit, WeekStart } from "@/lib/ritmo/types";
import { ChevronLeft } from "lucide-react";

export function ShareView({
  habit,
  entries,
  weekStartsOn,
  pro,
  onBack,
  onPro,
}: {
  habit: Habit;
  entries: EntriesMap;
  weekStartsOn: WeekStart;
  pro: boolean;
  onBack: () => void;
  onPro: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const today = todayISO();
  const streaks = computeStreaks(habit, entries, today, weekStartsOn);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;
    ctx.fillStyle = "#121110";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1a1917";
    roundRect(ctx, 72, 96, W - 144, H - 220, 36);
    ctx.fill();
    ctx.fillStyle = "#f3f1ec";
    ctx.font = "600 52px Georgia, serif";
    ctx.fillText(`${habit.emoji}  ${habit.name}`, 120, 200);
    ctx.fillStyle = "#a39e94";
    ctx.font = "400 28px system-ui, sans-serif";
    ctx.fillText(`Racha ${streaks.current} · mejor ${streaks.best}`, 120, 250);

    const weeks = 16;
    const cell = 44;
    const gap = 8;
    const end = startOfWeek(today, weekStartsOn);
    const start = addDays(end, -(weeks - 1) * 7);
    const created = createdDate(habit);
    for (let w = 0; w < weeks; w++) {
      for (let r = 0; r < 7; r++) {
        const iso = addDays(start, w * 7 + r);
        const x = 120 + w * (cell + gap);
        const y = 320 + r * (cell + gap);
        const future = iso > today;
        const before = iso < created;
        const met = !future && !before && isDayMet(habit, iso, entries, today);
        ctx.fillStyle = future || before ? "#2a2724" : met ? habit.color : "#2e2a26";
        ctx.globalAlpha = future ? 0.25 : 1;
        roundRect(ctx, x, y, cell, cell, 6);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.fillStyle = "#7f9a86";
    ctx.font = "500 26px system-ui, sans-serif";
    ctx.fillText("RitmoGrid  ·  Haz visible la constancia.", 120, H - 160);
  }, [habit, entries, weekStartsOn, today, streaks.current, streaks.best]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `ritmogrid-${habit.name.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  }

  async function share() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const file = new File([blob], "ritmogrid.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: habit.name, text: "Mi constancia en RitmoGrid" });
    } else {
      download();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-1 px-2 pt-[max(10px,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} className="size-11 grid place-items-center" aria-label="Volver">
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="font-display text-xl tracking-tight">Compartir</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-8 no-scrollbar">
        <canvas ref={canvasRef} className="mt-3 w-full rounded-lg border border-border" style={{ aspectRatio: "1080/1350" }} />
        {pro ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button onClick={() => void share()}>Compartir</Button>
            <Button variant="secondary" onClick={download}>
              Guardar PNG
            </Button>
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-elevated p-4">
            <p className="text-sm">La tarjeta de progreso es parte de Pro.</p>
            <Button className="mt-3 w-full" onClick={onPro}>
              Ver Pro
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
