export const SOCIAL_PLATFORMS = [
  { id: "twitter", label: "X / Twitter", placeholder: "https://x.com/…" },
  { id: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
  { id: "twitch", label: "Twitch", placeholder: "https://twitch.tv/…" },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/…" },
  { id: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@…" },
  { id: "faceit", label: "FACEIT", placeholder: "https://www.faceit.com/…" },
  { id: "tracker", label: "Tracker", placeholder: "https://tracker.gg/…" },
  { id: "steam", label: "Steam", placeholder: "https://steamcommunity.com/…" },
  { id: "kick", label: "Kick", placeholder: "https://kick.com/…" },
  { id: "website", label: "Site web", placeholder: "https://…" },
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORMS)[number]["id"];

const PLATFORM_IDS = new Set<string>(SOCIAL_PLATFORMS.map((p) => p.id));

export function isSocialPlatformId(value: string): value is SocialPlatformId {
  return PLATFORM_IDS.has(value);
}

export function getSocialPlatform(id: string) {
  return SOCIAL_PLATFORMS.find((p) => p.id === id) ?? SOCIAL_PLATFORMS.find((p) => p.id === "website")!;
}

export function normalizeSocialPlatformId(raw: string): SocialPlatformId {
  const lower = raw.trim().toLowerCase();
  if (isSocialPlatformId(lower)) return lower;
  if (lower.includes("twitter") || lower === "x") return "twitter";
  if (lower.includes("insta")) return "instagram";
  if (lower.includes("twitch")) return "twitch";
  if (lower.includes("youtu")) return "youtube";
  if (lower.includes("tiktok")) return "tiktok";
  if (lower.includes("faceit")) return "faceit";
  if (lower.includes("tracker")) return "tracker";
  if (lower.includes("steam")) return "steam";
  if (lower.includes("kick")) return "kick";
  return "website";
}
