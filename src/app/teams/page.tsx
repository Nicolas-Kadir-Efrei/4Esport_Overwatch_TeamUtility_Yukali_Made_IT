import Link from "next/link";
import { TeamCard } from "@/components/team-card";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function TeamsPage() {
  const user = await requireUser();
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      members: {
        include: { user: true },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
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
        <div className="panel mb-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4 fade-up">
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
          const isMine = membership?.teamId === team.id;

          return (
            <TeamCard
              key={team.id}
              team={team}
              isMine={isMine}
              requestStatus={req?.status}
              canApply={!membership}
            />
          );
        })}
      </div>
    </main>
  );
}
