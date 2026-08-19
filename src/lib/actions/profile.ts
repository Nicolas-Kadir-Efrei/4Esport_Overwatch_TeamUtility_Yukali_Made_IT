"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { unstable_update } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import {
  PLAYER_ROLES,
  type PlayerRoleValue,
} from "@/lib/constants";
import {
  isSocialPlatformId,
  normalizeSocialPlatformId,
} from "@/lib/social-platforms";
import { isUploadBlob, saveUploadedImage } from "@/lib/uploads";
import { isAllowedStoredImageUrl, sanitizeHttpUrl } from "@/lib/security/safe";
import {
  clientIpFromHeaders,
  rateLimit,
} from "@/lib/security/rate-limit";

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const ROLE_VALUES = new Set(PLAYER_ROLES.map((r) => r.value));

const profileSchema = z.object({
  displayName: z.string().min(2).max(40).trim(),
  battleTag: z.string().max(40).trim().optional(),
  discord: z.string().max(80).trim().optional(),
});

const slotSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export type ProfileActionState = {
  error?: string;
  success?: string;
};

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    battleTag: formData.get("battleTag") || undefined,
    discord: formData.get("discord") || undefined,
  });
  if (!parsed.success) {
    return { error: "Pseudo invalide (2–40 caractères)." };
  }

  const discord = parsed.data.discord?.trim() || null;
  if (discord && /^javascript:/i.test(discord)) {
    return { error: "Discord invalide." };
  }

  const smurfRaw = String(formData.get("smurfTags") ?? "");
  let smurfTags: string[] = [];
  try {
    const parsedSmurfs = JSON.parse(smurfRaw || "[]");
    if (!Array.isArray(parsedSmurfs)) {
      return { error: "Liste de smurfs invalide." };
    }
    smurfTags = [
      ...new Set(
        parsedSmurfs
          .map((t) => String(t).trim())
          .filter((t) => t.length > 0 && t.length <= 40),
      ),
    ].slice(0, 8);
  } catch {
    return { error: "Liste de smurfs invalide." };
  }

  const linksRaw = String(formData.get("links") ?? "[]");
  let links: { label: string; url: string }[] = [];
  try {
    const parsedLinks = JSON.parse(linksRaw || "[]");
    if (!Array.isArray(parsedLinks)) {
      return { error: "Liens invalides." };
    }
    const cleaned: { label: string; url: string }[] = [];
    for (const item of parsedLinks as { label?: string; url?: string }[]) {
      const raw = String(item.label ?? "").trim();
      const label = isSocialPlatformId(raw)
        ? raw
        : normalizeSocialPlatformId(raw);
      const url = sanitizeHttpUrl(String(item.url ?? ""));
      if (label && url) cleaned.push({ label, url });
    }
    const byPlatform = new Map<string, { label: string; url: string }>();
    for (const l of cleaned) byPlatform.set(l.label, l);
    links = [...byPlatform.values()].slice(0, 10);
  } catch {
    return { error: "Liens invalides." };
  }

  const selectedRoles = formData
    .getAll("playerRoles")
    .map(String)
    .filter((r): r is PlayerRoleValue => ROLE_VALUES.has(r as PlayerRoleValue));

  if (selectedRoles.length > 5) {
    return { error: "Trop de rôles sélectionnés." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        displayName: parsed.data.displayName,
        battleTag: parsed.data.battleTag || null,
        discord,
        smurfTags,
        playerRoles: selectedRoles,
      },
    });
    await tx.userLink.deleteMany({ where: { userId: user.id } });
    if (links.length > 0) {
      await tx.userLink.createMany({
        data: links.map((l) => ({
          userId: user.id,
          label: l.label,
          url: l.url,
        })),
      });
    }
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/teams");
  return { success: "Profil mis à jour." };
}

export async function uploadAvatar(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const limited = rateLimit(`upload:avatar:${user.id}:${ip}`, 30, 15 * 60 * 1000);
  if (!limited.ok) {
    return { error: `Trop d’uploads. Réessaie dans ${limited.retryAfterSec}s.` };
  }

  const raw = formData.get("avatar");
  if (!isUploadBlob(raw)) {
    return { error: "Choisis une image (PNG, JPG, WebP ou GIF)." };
  }

  try {
    const saved = await saveUploadedImage(raw, "avatars", user.id);
    if ("error" in saved) return { error: saved.error };

    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: saved.url },
    });

    await unstable_update({ user: { avatarUrl: saved.url } });
  } catch (e) {
    console.error("uploadAvatar", e);
    return { error: "Échec de l’upload. Réessaie avec un PNG, JPG, WebP ou GIF plus léger." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/teams");
  return { success: "Photo de profil mise à jour." };
}

export async function setAvatarUrl(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  const rawUrl = String(formData.get("avatarUrl") ?? "").trim();
  const baseUrl = rawUrl.split("?")[0] ?? rawUrl;

  if (!isAllowedStoredImageUrl(baseUrl, "avatars", user.id)) {
    return { error: "URL d’avatar invalide." };
  }

  const avatarUrl = rawUrl.includes("?") ? rawUrl : `${rawUrl}?v=${Date.now()}`;

  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  });

  await unstable_update({ user: { avatarUrl } });

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/teams");
  return { success: "Photo de profil mise à jour." };
}

export async function saveAvailability(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser();
  const raw = String(formData.get("slots") ?? "[]");
  let slots: unknown;
  try {
    slots = JSON.parse(raw);
  } catch {
    return { error: "Format de disponibilités invalide." };
  }

  const parsed = z.array(slotSchema).safeParse(slots);
  if (!parsed.success) {
    return { error: "Créneaux invalides." };
  }

  if (parsed.data.length > 40) {
    return { error: "Trop de créneaux." };
  }

  for (const slot of parsed.data) {
    if (slot.startTime >= slot.endTime) {
      return { error: "L'heure de fin doit être après le début." };
    }
    if (!DAYS.includes(slot.dayOfWeek as (typeof DAYS)[number])) {
      return { error: "Jour invalide." };
    }
  }

  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { userId: user.id } }),
    prisma.availability.createMany({
      data: parsed.data.map((s) => ({
        userId: user.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    }),
  ]);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: "Disponibilités enregistrées." };
}
