export const DAY_LABELS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
] as const;

export const DAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;

export function formatMatchType(type: string) {
  switch (type) {
    case "SCRIM":
      return "Scrim";
    case "TOURNAMENT":
      return "Tournoi";
    case "RANKED":
      return "Ranked";
    default:
      return "Autre";
  }
}

export function formatMatchResult(result: string) {
  switch (result) {
    case "WIN":
      return "Victoire";
    case "LOSS":
      return "Défaite";
    case "DRAW":
      return "Égalité";
    case "CANCELLED":
      return "Annulé";
    default:
      return "Planifié";
  }
}

export function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const PLAYER_ROLES = [
  { value: "TANK", label: "Tank", group: "Tank" },
  { value: "DPS_HITSCAN", label: "Hitscan", group: "DPS" },
  { value: "DPS_FLEX", label: "Flex", group: "DPS" },
  { value: "SUPPORT_MAIN", label: "Main", group: "Healer" },
  { value: "SUPPORT_OFF", label: "Off", group: "Healer" },
] as const;

export type PlayerRoleValue = (typeof PLAYER_ROLES)[number]["value"];

export function formatPlayerRole(role: string) {
  switch (role) {
    case "TANK":
      return "Tank";
    case "DPS_HITSCAN":
      return "DPS Hitscan";
    case "DPS_FLEX":
      return "DPS Flex";
    case "SUPPORT_MAIN":
      return "Healer Main";
    case "SUPPORT_OFF":
      return "Healer Off";
    default:
      return role;
  }
}

export function formatPlayerRolesShort(roles: string[]) {
  if (roles.length === 0) return null;
  return roles.map(formatPlayerRole).join(" · ");
}

export const LINEUP_STATUS_OPTIONS = [
  { value: "PRESENT", label: "Présent", className: "avail-yes" },
  { value: "PENDING", label: "Indécis", className: "avail-maybe" },
  { value: "ABSENT", label: "Absent", className: "avail-no" },
] as const;

export function formatLineupStatus(status: string | null | undefined) {
  switch (status) {
    case "PRESENT":
      return "Présent";
    case "ABSENT":
      return "Absent";
    default:
      return "Indécis";
  }
}

export function lineupStatusClass(status: string | null | undefined) {
  switch (status) {
    case "PRESENT":
      return "avail-yes";
    case "ABSENT":
      return "avail-no";
    default:
      return "avail-maybe";
  }
}

export function overlapsSlot(
  dayOfWeek: number,
  matchHour: number,
  matchMinute: number,
  slots: { dayOfWeek: number; startTime: string; endTime: string }[],
) {
  const matchMins = matchHour * 60 + matchMinute;
  return slots.some((s) => {
    if (s.dayOfWeek !== dayOfWeek) return false;
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return matchMins >= start && matchMins < end;
  });
}
