import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AdminMatchForm } from "@/components/admin-forms";
import { AdminNav } from "@/components/admin-nav";
import { TeamLogo } from "@/components/team-logo";
import { adminDeleteMatch } from "@/lib/actions/admin";
import { formatMatchResult, formatMatchType } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function AdminMatchesPage() {
  await requireAdmin();
  const [teams, matches] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.match.findMany({
      include: { team: true },
      orderBy: { scheduledAt: "desc" },
      take: 50,
    }),
  ]);

  const teamOpts = teams.map((t) => ({ id: t.id, name: t.name, tag: t.tag }));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
      <h1 className="font-display text-5xl text-[var(--accent)]">Matches</h1>
      <p className="mt-2 text-[var(--muted)]">
        CRUD complet + résultats pour l&apos;historique.
      </p>
      <AdminNav current="/admin/matches" />

      <section className="panel mb-8 p-5">
        <h2 className="font-display mb-4 text-2xl">Nouveau match</h2>
        <AdminMatchForm teams={teamOpts} />
      </section>

      <section className="space-y-4">
        {matches.map((match) => (
          <article key={match.id} className="panel overflow-hidden">
            <div className="h-1" style={{ background: match.team.color }} />
            <div className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/matches/${match.id}`}
                    className="flex items-center gap-2 font-display text-2xl hover:text-[var(--accent)]"
                  >
                    <TeamLogo
                      src={match.opponentLogoUrl}
                      name={match.opponent}
                      tag={match.opponent.slice(0, 3)}
                      size="sm"
                    />
                    vs {match.opponent}
                  </Link>
                  <p className="text-sm text-[var(--muted)]">
                    [{match.team.tag}] · {formatMatchType(match.type)} ·{" "}
                    {formatMatchResult(match.result)}
                    {match.score ? ` · ${match.score}` : ""} ·{" "}
                    {format(match.scheduledAt, "d MMM yyyy HH:mm", { locale: fr })}
                  </p>
                </div>
                <form action={adminDeleteMatch}>
                  <input type="hidden" name="id" value={match.id} />
                  <button className="btn btn-danger text-xs" type="submit">
                    Supprimer
                  </button>
                </form>
              </div>
              <AdminMatchForm teams={teamOpts} match={match} />
            </div>
          </article>
        ))}
        {matches.length === 0 && (
          <div className="panel p-5 text-[var(--muted)]">Aucun match.</div>
        )}
      </section>
    </main>
  );
}
