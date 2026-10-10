import { deleteDoctor } from "@/lib/server/data/admin";
import { CACHE_TAGS, invalidate } from "@/lib/server/data/cacheTags";
import { handleApi } from "@/lib/server/http";
import { requireApiSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";

export const DELETE = handleApi<{ ok: boolean }, { key: string }>(
  async (_request, context) => {
    await requireApiSession([ROLES.admin]);
    const { key } = await context.params;
    await deleteDoctor(key);
    invalidate(CACHE_TAGS.doctors);
    return { ok: true };
  }
);
