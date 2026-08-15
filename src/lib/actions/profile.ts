"use server";

import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  PLAYER_ROLES,
  type PlayerRoleValue,
} from "@/lib/constants";
import {
  isSocialPlatformId,
  normalizeSocialPlatformId,
} from "@/lib/social-platforms";

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
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

function isUploadBlob(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "size" in value &&
    typeof (value as Blob).arrayBuffer === "function" &&
    (value as Blob).size > 0
  );
}

function sniffExt(bytes: Uint8Array): string | null {
  if (bytes.length >= 6) {
    const gif =
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38 &&
      (bytes[4] === 0x39 || bytes[4] === 0x37) &&
      bytes[5] === 0x61;
    if (gif) return "gif";
  }
  if (bytes.length >= 8) {
    const png =
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47;
    if (png) return "png";
  }
  if (bytes.length >= 3) {
    const jpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (jpg) return "jpg";
  }
  if (bytes.length >= 12) {
    const riff =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46;
    const webp =
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;
    if (riff && webp) return "webp";
  }
  return null;
}

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
    const cleaned = parsedLinks
      .map((l: { label?: string; url?: string }) => {
        const raw = String(l.label ?? "").trim();
        const label = isSocialPlatformId(raw)
          ? raw
          : normalizeSocialPlatformId(raw);
        return {
          label,
          url: String(l.url ?? "").trim().slice(0, 500),
        };
      })
      .filter((l) => l.label && l.url && /^https?:\/\//i.test(l.url));
    // Une URL par plateforme
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
        discord: parsed.data.discord || null,
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
  const raw = formData.get("avatar");

  if (!isUploadBlob(raw)) {
    return { error: "Choisis une image (PNG, JPG, WebP ou GIF)." };
  }
  if (raw.size > MAX_AVATAR_BYTES) {
    return { error: "Fichier trop lourd (max 5 Mo)." };
  }

  const buffer = Buffer.from(await raw.arrayBuffer());
  const sniffed = sniffExt(buffer);
  const mimeExt = raw.type ? ALLOWED_MIME[raw.type] : undefined;
  const ext = sniffed ?? mimeExt;

  if (!ext) {
    return { error: "Format non supporté. Utilise PNG, JPG, WebP ou GIF." };
  }

  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });

  // Nettoie les anciennes extensions pour éviter les conflits jpg/gif
  for (const oldExt of ["png", "jpg", "jpeg", "webp", "gif"]) {
    try {
      await unlink(path.join(dir, `${user.id}.${oldExt}`));
    } catch {
      /* ignore */
    }
  }

  const filename = `${user.id}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);

  const avatarUrl = `/uploads/avatars/${filename}?v=${Date.now()}`;
  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl },
  });

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
