import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { PlayerName } from "@/components/captain-crown";
import { TeamLogo } from "@/components/team-logo";
import { JoinTeamForm } from "@/components/team-forms";
import type { JoinRequestStatus, TeamRole } from "@/generated/prisma/client";

type TeamCardMember = {
  id: string;
  role: TeamRole;
  user: {
    displayName: string;
    avatarUrl: string | null;
  };
};

export function TeamCard({
  team,
  isMine,
  requestStatus,
  canApply,
}: {
  team: {
    id: string;
    name: string;
    tag: string;
    description: string | null;
    color: string;
    logoUrl: string | null;
    members: TeamCardMember[];
  };
  isMine: boolean;
  requestStatus?: JoinRequestStatus;
  canApply: boolean;
}) {
  const count = team.members.length;

  return (
    <article className="panel team-card overflow-hidden fade-up">
      <div className="match-rail" style={{ background: team.color }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="team-card-head">
          <TeamLogo
            src={team.logoUrl}
            name={team.name}
            tag={team.tag}
            color={team.color}
            size="lg"
          />
          <div className="min-w-0">
            <p className="team-card-tag">[{team.tag}]</p>
            <h2 className="match-heading">
              <Link
                href={`/teams/${team.id}`}
                className="hover:text-[var(--accent)]"
              >
                {team.name}
              </Link>
            </h2>
            {isMine && (
              <p className="mt-1 text-xs font-semibold text-[var(--accent)]">
                Ton équipe
              </p>
            )}
          </div>
        </div>

        {team.description && (
          <p className="team-card-desc line-clamp-2">{team.description}</p>
        )}

        {count > 0 ? (
          <ul className="team-card-roster">
            {team.members.map((m) => (
              <li key={m.id} className="team-card-player">
                <Avatar
                  src={m.user.avatarUrl}
                  name={m.user.displayName}
                  size="sm"
                  className="!h-6 !w-6 !rounded-full"
                />
                <span className="max-w-[8.5rem] truncate">
                  <PlayerName
                    name={m.user.displayName}
                    captain={m.role === "CAPTAIN"}
                  />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">Aucun membre</p>
        )}

        <div className="team-card-foot">
          <p className="text-sm text-[var(--muted)]">
            {count} membre{count > 1 ? "s" : ""}
          </p>
          <Link
            href={`/teams/${team.id}`}
            className="text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Voir l&apos;équipe
          </Link>
        </div>

        {canApply && (
          <div className="mt-4 border-t border-[var(--line)] pt-4">
            {requestStatus === "PENDING" ? (
              <p className="text-sm text-[var(--ok)]">Demande en attente.</p>
            ) : requestStatus === "ACCEPTED" ? (
              <p className="text-sm text-[var(--ok)]">Déjà accepté.</p>
            ) : (
              <>
                {requestStatus === "REJECTED" && (
                  <p className="mb-3 text-sm text-[var(--danger)]">
                    Demande refusée — tu peux repostuler.
                  </p>
                )}
                <JoinTeamForm
                  teamId={team.id}
                  teamName={team.name}
                  compact
                />
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
