import { createService } from "@/lib/server/data/admin";
import { CACHE_TAGS, invalidate } from "@/lib/server/data/cacheTags";
import { handleApi, readJsonBody } from "@/lib/server/http";
import { requireApiSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";

export const POST = handleApi(async (request) => {
  await requireApiSession([ROLES.admin]);
  const service = await createService(await readJsonBody(request));
  invalidate(CACHE_TAGS.services);
  return { service };
});
