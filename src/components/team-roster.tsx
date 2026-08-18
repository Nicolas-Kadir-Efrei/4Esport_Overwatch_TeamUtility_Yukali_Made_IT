import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { KickMemberButton } from "@/components/captain-forms";
import { PlayerName } from "@/components/captain-crown";
import {
  DiscordIcon,
  SocialPlatformIcon,
} from "@/components/social-icons";
import { getSocialPlatform } from "@/lib/social-platforms";
import { formatPlayerRole } from "@/lib/constants";
import { isSafeHttpUrl, safeDiscordHref } from "@/lib/security/safe";

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

export function TeamRoster({
  teamId,
  members,
  accentColor,
  isManager,
  currentUserId,
  isAdmin,
  showProfileHint,
  showContacts = true,
}: {
  teamId: string;
  members: RosterMember[];
  accentColor: string;
  isManager: boolean;
  currentUserId: string;
  isAdmin: boolean;
  showProfileHint: boolean;
  showContacts?: boolean;
}) {
  return (
    <section className="mb-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Lineup</p>
          <h2 className="section-title">Roster</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Qui est dans l&apos;équipe, et sur quels rôles.
          </p>
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
                        <p className="roster-name min-w-0">
                          <PlayerName
                            name={m.user.displayName}
                            captain={isCaptain}
                          />
                        </p>
                      </div>
                      <p className="roster-tag truncate">
                        {m.user.battleTag ?? "Pas de BattleTag"}
                      </p>
                    </div>
                    {canKick && (
                      <KickMemberButton teamId={teamId} userId={m.userId} />
                    )}
                  </div>

                  <div className="roster-roles">
                    {m.user.playerRoles.length > 0 ? (
                      m.user.playerRoles.map((r) => (
                        <span key={r} className="roster-role">
                          {formatPlayerRole(r)}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[var(--muted)]">
                        Aucun rôle renseigné
                      </span>
                    )}
                  </div>

                  {showContacts && (
                  <div className="roster-contacts">
                    {m.user.discord
                      ? (() => {
                          const href = safeDiscordHref(m.user.discord);
                          if (href) {
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="roster-social roster-social-discord"
                                title={`Discord · ${m.user.discord}`}
                                aria-label={`Discord ${m.user.discord}`}
                              >
                                <DiscordIcon className="h-4 w-4" />
                              </a>
                            );
                          }
                          return (
                            <span
                              className="roster-social roster-social-discord opacity-80"
                              title={`Discord · ${m.user.discord}`}
                            >
                              <DiscordIcon className="h-4 w-4" />
                            </span>
                          );
                        })()
                      : null}
                    {m.user.links
                      .filter((l) => isSafeHttpUrl(l.url))
                      .map((l) => {
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
                  )}
                  {!showContacts && (
                    <p className="text-xs text-[var(--muted)]">
                      Contacts visibles pour les membres de l&apos;équipe.
                    </p>
                  )}
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
