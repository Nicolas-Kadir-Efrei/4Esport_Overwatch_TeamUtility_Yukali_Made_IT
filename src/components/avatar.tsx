type AvatarProps = {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-28 w-28 text-3xl",
};

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`avatar-frame object-cover ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <span
      className={`avatar-frame avatar-fallback grid place-items-center font-display ${sizes[size]} ${className}`}
      aria-hidden
    >
      {initial}
    </span>
  );
}
