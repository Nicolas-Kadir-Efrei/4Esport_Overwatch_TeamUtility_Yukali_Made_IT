import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { Avatar } from "@/components/avatar";

function Brand({ href }: { href: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3">
      <span
        className="grid h-10 w-10 place-items-center rounded-xl font-display text-sm text-[#120a02] shadow-[0_8px_24px_rgba(250,156,30,0.35)]"
        style={{ background: "linear-gradient(135deg,#fa9c1e,#ff6b2c)" }}
      >
        OW
      </span>
      <div className="leading-tight">
        <p className="font-display text-xl tracking-wide">OW Roster</p>
        <p className="text-[11px] text-[var(--muted)]">HQ Esport Overwatch</p>
      </div>
    </Link>
  );
}

function GuestNav() {
  return (
    <header className="nav-shell">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 md:px-6">
        <Brand href="/" />
        <nav className="hidden items-center gap-6 md:flex">
          <Link className="nav-link" href="/#features">
            Fonctions
          </Link>
          <Link className="nav-link" href="/login">
            Connexion
          </Link>
        </nav>
        <Link href="/register" className="btn btn-primary text-sm">
          Créer un compte
        </Link>
      </div>
    </header>
  );
}

export async function SiteNav() {
  // Sans cookie de session → nav guest instantanée (pas d’auth / pas de DB)
  const jar = await cookies();
  const hasSessionCookie = Boolean(
    jar.get("authjs.session-token")?.value ||
      jar.get("__Secure-authjs.session-token")?.value,
  );
  if (!hasSessionCookie) {
    return <GuestNav />;
  }

  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    return <GuestNav />;
  }

  return (
    <header className="nav-shell">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 md:px-6">
        <Brand href="/dashboard" />

        <nav className="hidden items-center gap-6 md:flex">
          <Link className="nav-link" href="/dashboard">
            Matches
          </Link>
          <Link className="nav-link" href="/matches/history">
            Historique
          </Link>
          <Link className="nav-link" href="/teams">
            Équipes
          </Link>
          <Link className="nav-link" href="/profile">
            Profil
          </Link>
          {user.role === "ADMIN" && (
            <Link className="nav-link" href="/admin">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-black/20 py-1 pl-1 pr-3 text-sm transition hover:border-[var(--line-strong)] sm:flex"
          >
            <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
            <span className="max-w-[8rem] truncate font-medium">
              {user.displayName}
            </span>
          </Link>
          <Link href="/profile" className="sm:hidden">
            <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
          </Link>
          <form action={logout}>
            <button type="submit" className="btn btn-ghost px-3 py-2 text-xs">
              Quitter
            </button>
          </form>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-t border-[var(--line)] px-3 py-2 md:hidden">
        {[
          ["/dashboard", "Matches"],
          ["/matches/history", "Histo"],
          ["/teams", "Équipes"],
          ["/profile", "Profil"],
          ...(user.role === "ADMIN" ? [["/admin", "Admin"] as const] : []),
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--muted)] hover:bg-white/5 hover:text-[var(--accent)]"
          >
            {label}
          </Link>
        ))}
      </div>
    </header>
  );
}
