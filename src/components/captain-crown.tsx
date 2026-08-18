export function CaptainCrown({
  className = "h-3.5 w-3.5",
}: {
  className?: string;
}) {
  return (
    <span
      className="captain-crown inline-flex shrink-0"
      title="Capitaine"
    >
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="currentColor"
        aria-hidden
      >
        <path d="M5 16.5 3 7.2l5.1 3.2L12 4.2l3.9 6.2 5.1-3.2-2 9.3H5Zm-.2 1.7h14.4V20H4.8v-1.8Z" />
      </svg>
      <span className="sr-only">Capitaine</span>
    </span>
  );
}

export function PlayerName({
  name,
  captain = false,
  className = "",
}: {
  name: string;
  captain?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex max-w-full items-center gap-1 ${className}`}>
      <span className="truncate">{name}</span>
      {captain ? <CaptainCrown /> : null}
    </span>
  );
}
