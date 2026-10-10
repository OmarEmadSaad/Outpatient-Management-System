import { registerAccount } from "@/lib/server/authFlows";
import { invalidate, CACHE_TAGS } from "@/lib/server/data/cacheTags";
import { clientIp, handleApi, readJsonBody } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { getSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";

export const POST = handleApi(async (request) => {
  const body = await readJsonBody(request);
  await enforceRateLimit(`register-ip:${clientIp(request)}`, {
    windowMs: 60 * 60 * 1000,
    limit: 20,
  });

  const session = await getSession();
  const account = await registerAccount(body, session?.role ?? null);
  if (account.role === ROLES.doctor) invalidate(CACHE_TAGS.doctors);
  return { role: account.role };
});
