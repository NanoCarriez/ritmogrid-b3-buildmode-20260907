import { cn } from "@/lib/utils";
import type { Habit } from "@/lib/ritmo/types";

export function CheckRing({
  habit,
  value,
  met,
  onToggle,
  onBump,
  size = 52,
}: {
  habit: Habit;
  value: number;
  met: boolean;
  onToggle: () => void;
  onBump?: (delta: number) => void;
  size?: number;
}) {
  const target = Math.max(1, habit.dailyTarget);
  const marks = habit.tracking === "count" ? Math.min(12, target) : 0;
  const r = (size - 6) / 2;
  const c = size / 2;

  return (
    <button
      type="button"
      onClick={onToggle}
      onContextMenu={(e) => {
        if (!onBump || habit.tracking !== "count") return;
        e.preventDefault();
        onBump(-1);
      }}
      aria-label={
        habit.kind === "quit"
          ? met
            ? "Día limpio. Toca para marcar un desliz."
            : "Desliz marcado. Toca para limpiar."
          : met
            ? "Completado. Toca para deshacer."
            : "Marcar hoy"
      }
      className={cn(
        "relative grid place-items-center rounded-full border-0 shrink-0",
        met && "check-pop",
      )}
      style={{
        width: size,
        height: size,
        background: met ? habit.color : "transparent",
        boxShadow: met ? `0 0 0 1px color-mix(in oklab, ${habit.color} 40%, transparent)` : "none",
        color: met ? "#121110" : habit.color,
      }}
    >
      <svg width={size} height={size} className="absolute inset-0" aria-hidden>
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={habit.color}
          strokeWidth={met ? 0 : 2}
          opacity={0.85}
        />
        {marks > 0
          ? Array.from({ length: marks }).map((_, i) => {
              const ang = (Math.PI * 2 * i) / marks - Math.PI / 2;
              const inner = r - 3;
              const outer = r + 1;
              const filled = i < Math.min(value, marks);
              return (
                <line
                  key={i}
                  x1={c + Math.cos(ang) * inner}
                  y1={c + Math.sin(ang) * inner}
                  x2={c + Math.cos(ang) * outer}
                  y2={c + Math.sin(ang) * outer}
                  stroke={met ? "#121110" : habit.color}
                  strokeWidth={filled ? 2.2 : 1}
                  opacity={filled ? 1 : 0.35}
                />
              );
            })
          : null}
      </svg>
      <span className="relative text-[15px] font-semibold leading-none">
        {habit.kind === "quit"
          ? met
            ? "✓"
            : "!"
          : habit.tracking === "count"
            ? value
            : met
              ? "✓"
              : ""}
      </span>
    </button>
  );
}
