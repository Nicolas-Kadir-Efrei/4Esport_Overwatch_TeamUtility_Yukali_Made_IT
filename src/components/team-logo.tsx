type TeamLogoProps = {
  src?: string | null;
  name: string;
  tag?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  color?: string;
};

const sizes = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-11 w-11 text-xs",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

export function TeamLogo({
  src,
  name,
  tag,
  size = "md",
  className = "",
  color,
}: TeamLogoProps) {
  const label = (tag ?? name).trim().slice(0, 3).toUpperCase() || "?";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`team-logo object-cover ${sizes[size]} ${className}`}
        style={color ? { borderColor: color } : undefined}
      />
    );
  }

  return (
    <span
      className={`team-logo team-logo-fallback grid place-items-center font-display ${sizes[size]} ${className}`}
      style={
        color
          ? {
              borderColor: color,
              color,
              background: `linear-gradient(145deg, ${color}33, rgba(21, 32, 51, 0.9))`,
            }
          : undefined
      }
      aria-hidden
    >
      {label}
    </span>
  );
}
