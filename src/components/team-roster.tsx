import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { KickMemberButton } from "@/components/captain-forms";
import {
  DiscordIcon,
  SocialPlatformIcon,
} from "@/components/social-icons";
import { getSocialPlatform } from "@/lib/social-platforms";
import { formatPlayerRole } from "@/lib/constants";

type RosterMember = {
  id: string;
  userId: string;
  role: string;
  user: {
    displayName: string;
    avatarUrl: string | null;
    battleTag: string | null;
    discord: string | null;
    playerRoles: string[];
    links: { label: string; url: string }[];
  };
};

function discordHref(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://discord.com/users/${encodeURIComponent(value)}`;
}

export function TeamRoster({
  teamId,
  members,
  accentColor,
  isManager,
  currentUserId,
  isAdmin,
  showProfileHint,
}: {
  teamId: string;
  members: RosterMember[];
  accentColor: string;
  isManager: boolean;
  currentUserId: string;
  isAdmin: boolean;
  showProfileHint: boolean;
}) {
  return (
    <section className="mb-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Lineup</p>
          <h2 className="font-display text-3xl">Roster & contacts</h2>
        </div>
        <p className="text-sm text-[var(--muted)]">
          {members.length} joueur{members.length > 1 ? "s" : ""}
        </p>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Aucun membre.</p>
      ) : (
        <ul className="roster-grid">
          {members.map((m, i) => {
            const isCaptain = m.role === "CAPTAIN";
            const canKick =
              isManager &&
              m.userId !== currentUserId &&
              (m.role !== "CAPTAIN" || isAdmin);
            const hasContacts = Boolean(m.user.discord) || m.user.links.length > 0;

            return (
              <li
                key={m.id}
                className="roster-card fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div
                  className="roster-card-rail"
                  style={{ background: accentColor }}
                />
                <div className="roster-card-body">
                  <div className="roster-card-top">
                    <Avatar
                      src={m.user.avatarUrl}
                      name={m.user.displayName}
                      size="lg"
                      className="roster-avatar"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="roster-name truncate">{m.user.displayName}</p>
                        {isCaptain && (
                          <span className="roster-badge">Capitaine</span>
                        )}
                      </div>
                      <p className="roster-tag truncate">
                        {m.user.battleTag ?? "Pas de BattleTag"}
                      </p>
                    </div>
                    {canKick && (
                      <KickMemberButton teamId={teamId} userId={m.userId} />
                    )}
                  </div>

                  {m.user.playerRoles.length > 0 && (
                    <div className="roster-roles">
                      {m.user.playerRoles.map((r) => (
                        <span key={r} className="roster-role">
                          {formatPlayerRole(r)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="roster-contacts">
                    {m.user.discord ? (
                      <a
                        href={discordHref(m.user.discord)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="roster-social roster-social-discord"
                        title={`Discord · ${m.user.discord}`}
                        aria-label={`Discord ${m.user.discord}`}
                      >
                        <DiscordIcon className="h-4 w-4" />
                      </a>
                    ) : null}
                    {m.user.links.map((l) => {
                      const meta = getSocialPlatform(l.label);
                      return (
                        <a
                          key={`${l.label}-${l.url}`}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="roster-social"
                          title={meta.label}
                          aria-label={meta.label}
                        >
                          <SocialPlatformIcon
                            platform={meta.id}
                            className="h-4 w-4"
                          />
                        </a>
                      );
                    })}
                    {!hasContacts && (
                      <span className="text-xs text-[var(--muted)]">
                        Pas de liens
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showProfileHint && (
        <p className="mt-4 text-xs text-[var(--muted)]">
          Ajoute ton Discord / réseaux dans{" "}
          <Link href="/profile" className="text-[var(--accent)] hover:underline">
            ton profil
          </Link>
          .
        </p>
      )}
    </section>
  );
}
