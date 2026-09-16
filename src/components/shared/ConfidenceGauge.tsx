import { cn } from "@/lib/utils";

// Radial confidence gauge built with SVG arcs.
export function ConfidenceGauge({
  value,
  size = 84,
  stroke = 8,
  className,
  label = "confidence",
}: {
  value: number | null | undefined;
  size?: number;
  stroke?: number;
  className?: string;
  label?: string;
}) {
  const v = value ?? 0;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, v)) / 100) * circumference;

  const color =
    v >= 85 ? "hsl(160 64% 40%)"
    : v >= 70 ? "hsl(199 92% 46%)"
    : "hsl(38 94% 50%)";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      title={`${label}: ${Math.round(v)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(222 30% 92%)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold leading-none" style={{ color }}>
          {Math.round(v)}%
        </span>
        <span className="mt-0.5 text-[8px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
