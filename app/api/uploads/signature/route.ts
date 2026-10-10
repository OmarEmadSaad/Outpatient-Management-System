import { NextResponse } from "next/server";
import {
  createUploadSignature,
  isUploadPurpose,
  UPLOAD_PURPOSES,
} from "@/lib/server/cloudinary";
import {
  clientIp,
  HttpError,
  jsonError,
  readJsonBody,
} from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { getSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";
import { assertSameOrigin } from "@/lib/server/http";

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const body = await readJsonBody(request);
    const purpose = isUploadPurpose(body.purpose) ? body.purpose : null;
    if (!purpose) throw new HttpError(400, "Unknown upload type.");

    const session = await getSession();
    if (
      UPLOAD_PURPOSES[purpose].requiresAdmin &&
      session?.role !== ROLES.admin
    ) {
      throw new HttpError(
        403,
        "You do not have permission to upload this image."
      );
    }
    await enforceRateLimit(`upload:${session?.uid || clientIp(request)}`, {
      windowMs: 60 * 60 * 1000,
      limit: session ? 60 : 10,
    });

    const signature = createUploadSignature(purpose);
    if (!signature) {
      return NextResponse.json({ signed: false }, { status: 200 });
    }
    return NextResponse.json({ signed: true, ...signature });
  } catch (error) {
    return jsonError(error);
  }
}
