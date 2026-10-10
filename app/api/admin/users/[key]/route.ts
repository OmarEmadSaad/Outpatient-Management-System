import { setUserRole } from "@/lib/server/data/admin";
import { handleApi, readJsonBody } from "@/lib/server/http";
import { requireApiSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";

export const PATCH = handleApi<{ ok: boolean }, { key: string }>(
  async (request, context) => {
    const session = await requireApiSession([ROLES.admin]);
    const { key } = await context.params;
    const body = await readJsonBody(request);
    await setUserRole(session, key, body.role);
    return { ok: true };
  }
);
