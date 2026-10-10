import { deleteService, updateService } from "@/lib/server/data/admin";
import { CACHE_TAGS, invalidate } from "@/lib/server/data/cacheTags";
import { handleApi, readJsonBody } from "@/lib/server/http";
import { requireApiSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";

export const PATCH = handleApi<{ ok: boolean }, { key: string }>(
  async (request, context) => {
    await requireApiSession([ROLES.admin]);
    const { key } = await context.params;
    await updateService(key, await readJsonBody(request));
    invalidate(CACHE_TAGS.services);
    return { ok: true };
  }
);

export const DELETE = handleApi<{ ok: boolean }, { key: string }>(
  async (_request, context) => {
    await requireApiSession([ROLES.admin]);
    const { key } = await context.params;
    await deleteService(key);
    invalidate(CACHE_TAGS.services);
    return { ok: true };
  }
);
