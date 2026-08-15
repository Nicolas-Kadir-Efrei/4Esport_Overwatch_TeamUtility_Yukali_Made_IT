import { DAY_LABELS, DAY_SHORT } from "@/lib/constants";
import { Avatar } from "@/components/avatar";
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
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--line)] text-[var(--muted)]">
            <th className="px-4 py-3 font-semibold">Joueur</th>
            {days.map((d) => (
              <th key={d} className="px-2 py-3 text-center font-semibold">
                {DAY_SHORT[d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b border-[var(--line)]/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar src={m.avatarUrl} name={m.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.displayName}</p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {m.teamRole === "CAPTAIN" ? "Capitaine" : "Joueur"}
                      {m.battleTag ? ` · ${m.battleTag}` : ""}
                    </p>
                  </div>
                </div>
              </td>
              {days.map((d) => {
                const slots = m.availabilities.filter((s) => s.dayOfWeek === d);
                return (
                  <td key={d} className="px-2 py-2 align-top text-center">
                    {slots.length === 0 ? (
                      <span className="text-xs text-[var(--muted)]">—</span>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        {slots.map((s) => (
                          <span
                            key={`${s.startTime}-${s.endTime}`}
                            className="avail-yes px-1.5 py-0.5 text-[10px] leading-tight"
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
                <p className="truncate text-sm font-semibold">{m.displayName}</p>
                <p className="truncate text-xs text-[var(--muted)]">
                  {m.teamRole === "CAPTAIN" ? "Capitaine" : "Joueur"}
                  {m.battleTag ? ` · ${m.battleTag}` : ""}
                </p>
                {(m.playerRoles?.length ?? 0) > 0 && (
                  <p className="truncate text-[11px] text-[var(--cyan)]">
                    {m.playerRoles!.map(formatPlayerRole).join(" · ")}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[var(--muted)]">
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
