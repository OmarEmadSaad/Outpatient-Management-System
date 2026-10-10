import { deleteAccountCompletely } from "@/lib/server/accounts";
import { CACHE_TAGS, invalidate } from "@/lib/server/data/cacheTags";
import { updatePatientProfile } from "@/lib/server/data/profiles";
import { handleApi, readJsonBody } from "@/lib/server/http";
import { endSession, requireApiSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";

export const PATCH = handleApi(async (request) => {
  const session = await requireApiSession([ROLES.patient]);
  const body = await readJsonBody(request);
  const result = await updatePatientProfile(session, body);
  if (result.changed) invalidate(CACHE_TAGS.reviews);
  return result;
});

export const DELETE = handleApi(async () => {
  const session = await requireApiSession([ROLES.patient]);
  await deleteAccountCompletely(session);
  await endSession();
  invalidate(CACHE_TAGS.reviews);
  return { ok: true };
});
