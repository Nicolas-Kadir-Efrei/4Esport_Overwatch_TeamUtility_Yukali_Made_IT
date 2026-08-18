import { DAY_LABELS, DAY_SHORT } from "@/lib/constants";
import { Avatar } from "@/components/avatar";
import { PlayerName } from "@/components/captain-crown";
import { formatPlayerRole, overlapsSlot } from "@/lib/constants";

export type AvailabilitySlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type PlayerAvailability = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  battleTag: string | null;
  smurfTags?: string[];
  playerRoles?: string[];
  teamRole?: string;
  availabilities: AvailabilitySlot[];
};

/** Grille hebdo des dispos d'un roster (page équipe). */
export function TeamAvailabilityOverview({
  members,
}: {
  members: PlayerAvailability[];
}) {
  if (members.length === 0) {
    return (
      <div className="panel p-5 text-sm text-[var(--muted)]">
        Aucun membre — les dispos apparaîtront ici.
      </div>
    );
  }

  const days = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="overflow-x-auto panel">
      <table className="avail-table">
        <thead>
          <tr>
            <th>Joueur</th>
            {days.map((d) => (
              <th key={d}>{DAY_SHORT[d]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>
                <div className="flex items-center gap-2">
                  <Avatar src={m.avatarUrl} name={m.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      <PlayerName
                        name={m.displayName}
                        captain={m.teamRole === "CAPTAIN"}
                      />
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {m.battleTag ?? ""}
                    </p>
                  </div>
                </div>
              </td>
              {days.map((d) => {
                const slots = m.availabilities.filter((s) => s.dayOfWeek === d);
                return (
                  <td key={d} className="text-center">
                    {slots.length === 0 ? (
                      <span className="text-sm text-[var(--muted)]">—</span>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        {slots.map((s) => (
                          <span
                            key={`${s.startTime}-${s.endTime}`}
                            className="avail-slot avail-yes"
                          >
                            {s.startTime}–{s.endTime}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Liste détaillée Dispo/Absent pour un créneau de match. */
export function MatchPlayerAvailabilityList({
  members,
  scheduledAt,
}: {
  members: PlayerAvailability[];
  scheduledAt: Date;
}) {
  const d = new Date(scheduledAt);
  const dayOfWeek = d.getDay();
  const hour = d.getHours();
  const minute = d.getMinutes();

  if (members.length === 0) {
    return (
      <div className="panel p-5 text-sm text-[var(--muted)]">
        Aucun membre dans l&apos;équipe.
      </div>
    );
  }

  const available = members.filter((m) =>
    overlapsSlot(dayOfWeek, hour, minute, m.availabilities),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--cyan)]">
        {available.length}/{members.length} joueurs dispo · {DAY_LABELS[dayOfWeek]}{" "}
        {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {members.map((m) => {
          const ok = overlapsSlot(dayOfWeek, hour, minute, m.availabilities);
          const daySlots = m.availabilities.filter((s) => s.dayOfWeek === dayOfWeek);
          return (
            <li key={m.id} className="member-row !items-start">
              <Avatar src={m.avatarUrl} name={m.displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  <PlayerName
                    name={m.displayName}
                    captain={m.teamRole === "CAPTAIN"}
                  />
                </p>
                <p className="truncate text-xs text-[var(--muted)]">
                  {m.battleTag ?? ""}
                </p>
                {(m.playerRoles?.length ?? 0) > 0 && (
                  <p className="truncate text-xs text-[var(--muted)]">
                    {m.playerRoles!.map(formatPlayerRole).join(" · ")}
                  </p>
                )}
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {daySlots.length > 0
                    ? `Créneaux ${DAY_SHORT[dayOfWeek]} : ${daySlots
                        .map((s) => `${s.startTime}–${s.endTime}`)
                        .join(", ")}`
                    : `Pas de créneau le ${DAY_SHORT[dayOfWeek]}`}
                </p>
              </div>
              <span className={`chip ${ok ? "avail-yes" : "avail-no"}`}>
                {ok ? "Dispo" : "Absent"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
