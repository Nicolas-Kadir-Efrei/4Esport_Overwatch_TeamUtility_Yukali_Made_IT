import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { getSessionUser } from "@/lib/session";
import { sanitizeFileBasename } from "@/lib/security/safe";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const safeUserId = sanitizeFileBasename(user.id);
  if (!safeUserId) {
    return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
  }

  const expectedPrefix = `avatars/${safeUserId}`;

  try {
    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (pathname !== expectedPrefix && !pathname.startsWith(`${expectedPrefix}.`)) {
          throw new Error("Chemin upload invalide.");
        }

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: false,
          allowOverwrite: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.info("avatar blob upload completed", blob.pathname, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("avatar blob handleUpload", error);
    const message =
      error instanceof Error ? error.message : "Upload Blob impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
