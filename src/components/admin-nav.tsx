import Link from "next/link";

const links = [
  { href: "/admin", label: "Candidatures" },
  { href: "/admin/teams", label: "Équipes" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/users", label: "Joueurs" },
];

export function AdminNav({ current }: { current: string }) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`btn text-xs ${
            current === l.href ? "btn-primary" : "btn-ghost"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
