import Link from "next/link";
import { AdminTeamForm } from "@/components/admin-forms";
import { AdminNav } from "@/components/admin-nav";
import { SetCaptainForm } from "@/components/captain-forms";
import { TeamLogo } from "@/components/team-logo";
import { adminDeleteTeam } from "@/lib/actions/admin";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function AdminTeamsPage() {
  await requireAdmin();
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { members: true, matches: true } },
      members: {
        include: { user: { select: { displayName: true } } },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
      <h1 className="page-title">Équipes</h1>
      <p className="mt-2 text-[var(--muted)]">Créer, modifier ou supprimer une équipe.</p>
      <AdminNav current="/admin/teams" />

      <section className="panel mb-8 p-5">
        <h2 className="section-title mb-4">Nouvelle équipe</h2>
        <AdminTeamForm />
      </section>

      <section className="space-y-4">
        {teams.map((team) => (
          <article key={team.id} className="panel overflow-hidden">
            <div className="h-1.5" style={{ background: team.color }} />
            <div className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <TeamLogo
                  src={team.logoUrl}
                  name={team.name}
                  tag={team.tag}
                  color={team.color}
                  size="md"
                />
                <div>
                  <Link
                    href={`/teams/${team.id}`}
                    className="match-heading hover:text-[var(--accent)]"
                  >
                    [{team.tag}] {team.name}
                  </Link>
                  <p className="text-sm text-[var(--muted)]">
                    {team._count.members} membres · {team._count.matches} matches
                  </p>
                </div>
              </div>
                <form action={adminDeleteTeam}>
                  <input type="hidden" name="id" value={team.id} />
                  <button className="btn btn-danger text-xs" type="submit">
                    Supprimer
                  </button>
                </form>
              </div>
              <AdminTeamForm team={team} />
              <div className="mt-5 border-t border-[var(--line)] pt-4">
                <SetCaptainForm
                  teamId={team.id}
                  members={team.members.map((m) => ({
                    userId: m.userId,
                    displayName: m.user.displayName,
                    role: m.role,
                  }))}
                />
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
