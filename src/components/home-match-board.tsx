import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar } from "@/components/avatar";
import { PlayerName } from "@/components/captain-crown";
import { TeamLogo } from "@/components/team-logo";
import { formatMatchType } from "@/lib/constants";

export type HomeTeamMatch = {
  team: {
    id: string;
    name: string;
    tag: string;
    color: string;
    logoUrl: string | null;
  };
  match: {
    opponent: string;
    opponentLogoUrl: string | null;
    type: string;
    scheduledAt: Date;
    present: number;
    absent: number;
    pending: number;
    lineup: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
      captain: boolean;
    }[];
  } | null;
};

export function HomeMatchBoard({ teams }: { teams: HomeTeamMatch[] }) {
  if (teams.length === 0) {
    return (
      <article className="home-match is-waiting fade-up-delay-2">
        <p className="home-match-waiting-label">En attente de match</p>
        <p className="home-match-waiting-hint">
          Les équipes n’ont pas encore de scrim au calendrier.
        </p>
      </article>
    );
  }

  return (
    <div className="home-board fade-up-delay-2">
      {teams.map((item) =>
        item.match ? (
          <HomeMatchCard key={item.team.id} team={item.team} match={item.match} />
        ) : (
          <HomeWaitingCard key={item.team.id} team={item.team} />
        ),
      )}
    </div>
  );
}

function HomeWaitingCard({ team }: { team: HomeTeamMatch["team"] }) {
  return (
    <article className="home-match is-waiting">
      <div className="home-match-rail" style={{ background: team.color }} />
      <div className="home-match-body">
        <div className="home-match-meta">
          <span className="chip">[{team.tag}]</span>
        </div>
        <div className="home-match-vs">
          <div className="home-match-side">
            <TeamLogo
              src={team.logoUrl}
              name={team.name}
              tag={team.tag}
              color={team.color}
              size="md"
            />
            <div>
              <p className="home-match-kicker">Équipe</p>
              <p className="home-match-name">{team.name}</p>
            </div>
          </div>
          <span className="home-match-vs-label">VS</span>
          <div className="home-match-side is-opp">
            <span className="home-match-slot">?</span>
            <div>
              <p className="home-match-kicker">Adversaire</p>
              <p className="home-match-name is-muted">À venir</p>
            </div>
          </div>
        </div>
        <p className="home-match-waiting-label">En attente de match</p>
      </div>
    </article>
  );
}

function HomeMatchCard({
  team,
  match,
}: {
  team: HomeTeamMatch["team"];
  match: NonNullable<HomeTeamMatch["match"]>;
}) {
  const when = new Date(match.scheduledAt);

  return (
    <article className="home-match">
      <div className="home-match-rail" style={{ background: team.color }} />
      <div className="home-match-body">
        <div className="home-match-meta">
          <span className="chip avail-maybe">{formatMatchType(match.type)}</span>
          <time dateTime={when.toISOString()} className="home-match-when">
            {format(when, "EEE d MMM · HH:mm", { locale: fr })}
          </time>
        </div>

        <div className="home-match-vs">
          <div className="home-match-side">
            <TeamLogo
              src={team.logoUrl}
              name={team.name}
              tag={team.tag}
              color={team.color}
              size="lg"
            />
            <div>
              <p className="home-match-kicker">[{team.tag}]</p>
              <p className="home-match-name">{team.name}</p>
            </div>
          </div>
          <span className="home-match-vs-label">VS</span>
          <div className="home-match-side is-opp">
            <TeamLogo
              src={match.opponentLogoUrl}
              name={match.opponent}
              tag={match.opponent.slice(0, 3)}
              size="lg"
            />
            <div>
              <p className="home-match-kicker">Adversaire</p>
              <p className="home-match-name">{match.opponent}</p>
            </div>
          </div>
        </div>

        <div className="home-match-rsvp">
          <span className="avail-yes px-2.5 py-1 text-xs">
            Présent {match.present}
          </span>
          <span className="avail-no px-2.5 py-1 text-xs">
            Absent {match.absent}
          </span>
          <span className="avail-maybe px-2.5 py-1 text-xs">
            Indécis {match.pending}
          </span>
        </div>

        <div className="home-match-lineup">
          {match.lineup.length === 0 ? (
            <p className="home-match-waiting-hint">Lineup en attente</p>
          ) : (
            match.lineup.map((player) => (
              <span key={player.id} className="home-match-player">
                <Avatar src={player.avatarUrl} name={player.displayName} size="sm" />
                <PlayerName
                  name={player.displayName}
                  captain={player.captain}
                />
              </span>
            ))
          )}
        </div>
      </div>
    </article>
  );
}
