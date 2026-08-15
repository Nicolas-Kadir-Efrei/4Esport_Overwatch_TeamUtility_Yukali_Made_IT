import Link from "next/link";
import { JoinTeamForm } from "@/components/team-forms";
import { Avatar } from "@/components/avatar";
import { TeamLogo } from "@/components/team-logo";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function TeamsPage() {
  const user = await requireUser();
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { members: true } },
      members: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  const membership = await prisma.teamMember.findUnique({
    where: { userId: user.id },
    include: { team: true },
  });

  const requests = await prisma.joinRequest.findMany({
    where: { userId: user.id },
  });
  const requestByTeam = new Map(requests.map((r) => [r.teamId, r]));

  return (
    <main className="shell">
      <PageHeader
        eyebrow="Roster"
        title="Équipes"
        description="Choisis ta line-up, envoie une demande, et l’admin te valide."
      />

      {membership && (
        <div className="panel mb-6 flex flex-wrap items-center justify-between gap-3 border-[var(--line-strong)] px-5 py-4 fade-up">
          <p className="text-sm">
            Tu es dans{" "}
            <strong className="text-[var(--accent)]">
              [{membership.team.tag}] {membership.team.name}
            </strong>{" "}
            · {membership.role === "CAPTAIN" ? "Capitaine" : "Joueur"}
          </p>
          <Link href={`/teams/${membership.teamId}`} className="btn btn-ghost text-xs">
            Ma page équipe
          </Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {teams.map((team) => {
          const req = requestByTeam.get(team.id);
          const canApply = !membership;

          return (
            <article key={team.id} className="panel overflow-hidden fade-up">
              <div className="match-rail" style={{ background: team.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <TeamLogo
                      src={team.logoUrl}
                      name={team.name}
                      tag={team.tag}
                      color={team.color}
                      size="lg"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-[0.18em] text-[var(--muted)]">
                        [{team.tag}]
                      </p>
                      <Link
                        href={`/teams/${team.id}`}
                        className="font-display text-3xl hover:text-[var(--accent)]"
                      >
                        {team.name}
                      </Link>
                    </div>
                  </div>
                  <span className="chip avail-maybe">
                    {team._count.members} membre
                    {team._count.members > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {team.description}
                </p>

                {team.members.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {team.members.slice(0, 8).map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-black/25 py-1 pl-1 pr-2.5 text-xs"
                      >
                        <Avatar
                          src={m.user.avatarUrl}
                          name={m.user.displayName}
                          size="sm"
                          className="!h-6 !w-6 !rounded-full !border"
                        />
                        {m.user.displayName}
                        {m.role === "CAPTAIN" ? " ★" : ""}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/teams/${team.id}`} className="btn btn-ghost text-xs">
                    Voir l&apos;équipe
                  </Link>
                </div>

                <div className="mt-5 border-t border-[var(--line)] pt-4">
                  {!canApply ? (
                    <p className="text-sm text-[var(--muted)]">
                      Tu as déjà une équipe — candidatures fermées.
                    </p>
                  ) : req?.status === "PENDING" ? (
                    <p className="alert alert-ok">Demande en attente de validation.</p>
                  ) : req?.status === "ACCEPTED" ? (
                    <p className="text-sm text-[var(--ok)]">Déjà accepté.</p>
                  ) : (
                    <>
                      {req?.status === "REJECTED" && (
                        <p className="mb-3 alert alert-error">
                          Demande précédente refusée — tu peux repostuler.
                        </p>
                      )}
                      <JoinTeamForm teamId={team.id} teamName={team.name} />
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
