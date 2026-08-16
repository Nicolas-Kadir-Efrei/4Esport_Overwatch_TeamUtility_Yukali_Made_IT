import { z } from "zod";

/** Mot de passe : min 10, lettre + chiffre. */
export const passwordSchema = z
  .string()
  .min(10, "Mot de passe trop court (min. 10).")
  .max(100)
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), {
    message: "Le mot de passe doit contenir au moins une lettre et un chiffre.",
  });

export function passwordPolicyHint() {
  return "Min. 10 caractères, avec lettre et chiffre.";
}

/** IDs sûrs pour noms de fichiers (cuid / cuid2 / alphanum). */
export function sanitizeFileBasename(raw: string): string | null {
  const cleaned = raw.trim();
  // cuid classique ~25, parfois un peu plus long
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(cleaned)) return null;
  if (cleaned.includes("..") || cleaned.includes("/") || cleaned.includes("\\")) {
    return null;
  }
  return cleaned;
}

const ALLOWED_UPLOAD_SUBDIRS = new Set(["avatars", "teams", "opponents"]);

export function sanitizeUploadSubdir(raw: string): string | null {
  if (!ALLOWED_UPLOAD_SUBDIRS.has(raw)) return null;
  return raw;
}

const DISCORD_HOSTS = new Set([
  "discord.com",
  "www.discord.com",
  "discord.gg",
  "www.discord.gg",
  "discordapp.com",
  "www.discordapp.com",
  "cdn.discordapp.com",
]);

/** Construit un href Discord sûr, ou null si danger. */
export function safeDiscordHref(value: string): string | null {
  const raw = value.trim();
  if (!raw || raw.length > 120) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:" && u.protocol !== "http:") return null;
      if (!DISCORD_HOSTS.has(u.hostname.toLowerCase())) return null;
      return u.toString();
    } catch {
      return null;
    }
  }

  // Pseudo Discord (pas d'URL) — pas de lien cliquable dangereux
  if (/^[a-zA-Z0-9._-]{2,40}(#[0-9]{1,6})?$/.test(raw)) {
    return null; // afficher en texte seulement
  }
  return null;
}

export function isSafeHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Bloque javascript:, data:, etc. et force http(s). */
export function sanitizeHttpUrl(raw: string, maxLen = 500): string | null {
  const trimmed = raw.trim().slice(0, maxLen);
  const withProto = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  if (!isSafeHttpUrl(withProto)) return null;
  try {
    const u = new URL(withProto);
    if (u.username || u.password) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function sanitizeTeamColor(raw: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(raw) ? raw : "#FA9C1E";
}
