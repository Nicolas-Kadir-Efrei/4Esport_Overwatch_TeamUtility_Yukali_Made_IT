import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  sanitizeFileBasename,
  sanitizeUploadSubdir,
} from "@/lib/security/safe";

export const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5 Mo — GIFs animés inclus

export function isUploadBlob(
  value: FormDataEntryValue | null,
): value is File {
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

function isPathInside(parent: string, child: string): boolean {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/** Enregistre une image dans public/uploads/<subdir>/<basename>.ext */
export async function saveUploadedImage(
  file: File,
  subdir: string,
  basename: string,
): Promise<{ url: string } | { error: string }> {
  const safeSub = sanitizeUploadSubdir(subdir);
  const safeBase = sanitizeFileBasename(basename);
  if (!safeSub || !safeBase) {
    return { error: "Identifiant fichier invalide." };
  }

  if (file.size > MAX_LOGO_BYTES) {
    return {
      error: `Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} Mo, max 5 Mo).`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // On se fie uniquement aux magic bytes (pas au Content-Type navigateur)
  const ext = sniffExt(buffer);
  if (!ext) {
    return { error: "Format non supporté. Utilise PNG, JPG, WebP ou GIF." };
  }

  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const resolvedDir = path.resolve(uploadsRoot, safeSub);
  if (!isPathInside(uploadsRoot, resolvedDir)) {
    return { error: "Chemin upload invalide." };
  }

  try {
    await mkdir(resolvedDir, { recursive: true });
  } catch {
    return {
      error:
        "Impossible d’écrire le fichier (filesystem). En local, vérifie les droits du dossier public/uploads.",
    };
  }

  for (const oldExt of ["png", "jpg", "jpeg", "webp", "gif"]) {
    try {
      await unlink(path.join(resolvedDir, `${safeBase}.${oldExt}`));
    } catch {
      /* ignore */
    }
  }

  const filename = `${safeBase}.${ext}`;
  const fullPath = path.join(resolvedDir, filename);
  if (!isPathInside(resolvedDir, fullPath)) {
    return { error: "Chemin upload invalide." };
  }

  try {
    await writeFile(fullPath, buffer);
  } catch (e) {
    console.error("upload write failed", e);
    return {
      error:
        "Écriture impossible. Sur Vercel le disque n’est pas persistant — utilise le mode local ou un stockage cloud.",
    };
  }

  return { url: `/uploads/${safeSub}/${filename}?v=${Date.now()}` };
}
