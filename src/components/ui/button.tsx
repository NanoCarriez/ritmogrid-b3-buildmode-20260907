import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";

const styles: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg hover:opacity-90 active:scale-[0.98]",
  secondary:
    "bg-elevated text-fg border border-border hover:bg-surface active:scale-[0.98]",
  ghost: "bg-transparent text-fg hover:bg-elevated active:scale-[0.98]",
  danger: "bg-danger/15 text-danger hover:bg-danger/25 active:scale-[0.98]",
  soft: "bg-elevated text-fg hover:bg-surface active:scale-[0.98]",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }
>(function Button({ className, variant = "primary", size = "md", type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-transform duration-(--motion-quick) ease-(--ease-out) disabled:opacity-40 disabled:pointer-events-none",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-base",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
});
