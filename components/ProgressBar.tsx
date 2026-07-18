export function ProgressBar({
  value,
  max,
  tone = "emerald",
  height = 8,
}: {
  value: number;
  max: number;
  tone?: "emerald" | "navy" | "amber" | "error";
  height?: number;
}) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const over = max > 0 && value > max;
  const colors: Record<string, string> = {
    emerald: "linear-gradient(90deg, #059669, #34d399)",
    navy: "linear-gradient(90deg, #060d1f, #0a1b3d)",
    amber: "linear-gradient(90deg, #d97706, #fbbf24)",
    error: "linear-gradient(90deg, #ba1a1a, #ef4444)",
  };
  return (
    <div
      className="w-full rounded-full bg-lav overflow-hidden"
      style={{ height }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${ratio * 100}%`,
          background: over ? colors.error : colors[tone],
        }}
      />
    </div>
  );
}
