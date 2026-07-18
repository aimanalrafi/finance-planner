export function Icon({
  name,
  fill = false,
  size = 24,
  className = "",
}: {
  name: string;
  fill?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${fill ? "msf" : ""} ${className}`}
      style={{ fontSize: size }}
      aria-hidden
    >
      {name}
    </span>
  );
}
