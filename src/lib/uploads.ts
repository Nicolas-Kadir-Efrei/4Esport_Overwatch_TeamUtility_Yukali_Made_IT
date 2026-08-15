import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_LOGO_BYTES = 5 * 1024 * 1024;

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
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "Fichier trop lourd (max 5 Mo)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffExt(buffer);
  const mimeExt = file.type ? ALLOWED_MIME[file.type] : undefined;
  const ext = sniffed ?? mimeExt;

  if (!ext) {
    return { error: "Format non supporté. Utilise PNG, JPG, WebP ou GIF." };
  }

  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });

  for (const oldExt of ["png", "jpg", "jpeg", "webp", "gif"]) {
    try {
      await unlink(path.join(dir, `${basename}.${oldExt}`));
    } catch {
      /* ignore */
    }
  }

  const filename = `${basename}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return { url: `/uploads/${subdir}/${filename}?v=${Date.now()}` };
}
