import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  sanitizeFileBasename,
  sanitizeUploadSubdir,
} from "@/lib/security/safe";

const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 Mo (avatars/logos)

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
    return { error: "Fichier trop lourd (max 2 Mo)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffExt(buffer);
  if (!sniffed) {
    return { error: "Format non supporté. Utilise PNG, JPG, WebP ou GIF." };
  }

  // Le Content-Type client ne fait jamais foi seul
  const mimeExt = file.type ? ALLOWED_MIME[file.type] : undefined;
  if (mimeExt && mimeExt !== sniffed && !(mimeExt === "jpg" && sniffed === "jpg")) {
    // jpeg/jpg ok ; sinon refus si mismatch déclaré
    if (!(file.type === "image/jpeg" && sniffed === "jpg")) {
      return { error: "Type de fichier incohérent." };
    }
  }

  const ext = sniffed;
  const dir = path.join(process.cwd(), "public", "uploads", safeSub);

  // Garde-fou path traversal
  const resolvedDir = path.resolve(dir);
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  if (!resolvedDir.startsWith(uploadsRoot + path.sep) && resolvedDir !== uploadsRoot) {
    return { error: "Chemin upload invalide." };
  }

  await mkdir(resolvedDir, { recursive: true });

  for (const oldExt of ["png", "jpg", "jpeg", "webp", "gif"]) {
    try {
      await unlink(path.join(resolvedDir, `${safeBase}.${oldExt}`));
    } catch {
      /* ignore */
    }
  }

  const filename = `${safeBase}.${ext}`;
  const fullPath = path.join(resolvedDir, filename);
  if (!path.resolve(fullPath).startsWith(resolvedDir + path.sep)) {
    return { error: "Chemin upload invalide." };
  }

  await writeFile(fullPath, buffer);
  return { url: `/uploads/${safeSub}/${filename}?v=${Date.now()}` };
}
