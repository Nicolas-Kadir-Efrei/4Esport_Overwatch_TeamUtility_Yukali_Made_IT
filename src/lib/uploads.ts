import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import {
  sanitizeFileBasename,
  sanitizeUploadSubdir,
} from "@/lib/security/safe";

export const MAX_LOGO_BYTES = MAX_UPLOAD_BYTES;

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

function contentTypeForExt(ext: string): string {
  if (ext === "jpg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

function isPathInside(parent: string, child: string): boolean {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function useBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function saveToBlobStorage(
  buffer: Buffer,
  safeSub: string,
  safeBase: string,
  ext: string,
): Promise<{ url: string } | { error: string }> {
  const stamp = Date.now();
  const pathname = `${safeSub}/${safeBase}.${ext}`;

  try {
    const blob = await put(pathname, buffer, {
      access: "public",
      contentType: contentTypeForExt(ext),
      addRandomSuffix: false,
    });
    return { url: `${blob.url}?v=${stamp}` };
  } catch (e) {
    console.error("blob upload failed", e);
    return {
      error:
        "Échec de l’upload cloud. Vérifie que le stockage Blob est activé sur Vercel (BLOB_READ_WRITE_TOKEN).",
    };
  }
}

async function saveToLocalFilesystem(
  buffer: Buffer,
  safeSub: string,
  safeBase: string,
  ext: string,
): Promise<{ url: string } | { error: string }> {
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

  const stamp = Date.now();
  let filename = `${safeBase}.${ext}`;
  let fullPath = path.join(resolvedDir, filename);
  if (!isPathInside(resolvedDir, fullPath)) {
    return { error: "Chemin upload invalide." };
  }

  try {
    await writeFile(fullPath, buffer);
  } catch (e) {
    console.error("upload write failed, retry unique name", e);
    filename = `${safeBase}-${stamp}.${ext}`;
    fullPath = path.join(resolvedDir, filename);
    if (!isPathInside(resolvedDir, fullPath)) {
      return { error: "Chemin upload invalide." };
    }
    try {
      await writeFile(fullPath, buffer);
    } catch (retryErr) {
      console.error("upload write retry failed", retryErr);
      return {
        error:
          "Écriture impossible. Sur Vercel, active le stockage Blob (voir README / variables d’environnement).",
      };
    }
  }

  return { url: `/uploads/${safeSub}/${filename}?v=${stamp}` };
}

/** Enregistre une image (Blob Vercel en prod, public/uploads en local). */
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
  const ext = sniffExt(buffer);
  if (!ext) {
    return { error: "Format non supporté. Utilise PNG, JPG, WebP ou GIF." };
  }

  if (useBlobStorage()) {
    return saveToBlobStorage(buffer, safeSub, safeBase, ext);
  }

  return saveToLocalFilesystem(buffer, safeSub, safeBase, ext);
}
