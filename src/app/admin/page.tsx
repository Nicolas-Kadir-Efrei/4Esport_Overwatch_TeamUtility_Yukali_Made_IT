import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { ReviewRequestForm } from "@/components/team-forms";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function AdminPage() {
  await requireAdmin();

  const [requests, recent, counts] = await Promise.all([
    prisma.joinRequest.findMany({
      where: { status: "PENDING" },
      include: { user: true, team: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.joinRequest.findMany({
      where: { status: { not: "PENDING" } },
      include: { user: true, team: true },
      orderBy: { reviewedAt: "desc" },
      take: 8,
    }),
    prisma.$transaction([
      prisma.team.count(),
      prisma.match.count(),
      prisma.user.count(),
    ]),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
      <h1 className="page-title">Admin</h1>
      <p className="mt-2 text-[var(--muted)]">
        Gestion complète : équipes, matches, joueurs et candidatures.
      </p>
      <AdminNav current="/admin" />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Équipes", value: counts[0], href: "/admin/teams" },
          { label: "Matches", value: counts[1], href: "/admin/matches" },
          { label: "Joueurs", value: counts[2], href: "/admin/users" },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="panel p-4 hover:border-[var(--accent)]">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{c.label}</p>
            <p className="stat-value text-3xl text-[var(--text)]">{c.value}</p>
          </Link>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="section-title">Demandes en attente</h2>
        {requests.length === 0 ? (
          <div className="panel p-5 text-[var(--muted)]">Aucune demande en attente.</div>
        ) : (
          requests.map((r) => (
            <article key={r.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="section-title">{r.user.displayName}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {r.user.email}
                    {r.user.battleTag ? ` · ${r.user.battleTag}` : ""}
                  </p>
                  <p className="mt-2 text-sm">
                    Postule pour{" "}
                    <Link className="text-[var(--accent)]" href={`/teams/${r.teamId}`}>
                      [{r.team.tag}] {r.team.name}
                    </Link>
                  </p>
                  {r.message && (
                    <p className="mt-2 text-sm text-[var(--muted)]">« {r.message} »</p>
                  )}
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {format(r.createdAt, "d MMM yyyy · HH:mm", { locale: fr })}
                  </p>
                </div>
                <ReviewRequestForm requestId={r.id} />
              </div>
            </article>
          ))
        )}
      </section>

      <section className="mt-10">
        <h2 className="section-title mb-4">Historique candidatures</h2>
        <ul className="space-y-2">
          {recent.map((r) => (
            <li
              key={r.id}
              className="panel flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <span>
                {r.user.displayName} → [{r.team.tag}]
              </span>
              <span
                className={
                  r.status === "ACCEPTED" ? "text-[var(--ok)]" : "text-[var(--danger)]"
                }
              >
                {r.status === "ACCEPTED" ? "Accepté" : "Refusé"}
              </span>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="text-sm text-[var(--muted)]">Pas encore d&apos;historique.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
