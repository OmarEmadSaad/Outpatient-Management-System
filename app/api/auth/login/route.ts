import { loginWithPassword } from "@/lib/server/authFlows";
import { clientIp, handleApi, readJsonBody } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { startSession, toClientUser } from "@/lib/server/session";
import { normalizeEmail } from "@/lib/shared/validation";

const WINDOW = { windowMs: 10 * 60 * 1000 };

export const POST = handleApi(async (request) => {
  const body = await readJsonBody(request);
  await enforceRateLimit(`login-ip:${clientIp(request)}`, {
    ...WINDOW,
    limit: 30,
  });
  await enforceRateLimit(`login-email:${normalizeEmail(body.email)}`, {
    ...WINDOW,
    limit: 10,
  });

  const { idToken, account, refreshIdToken } = await loginWithPassword({
    email: body.email,
    password: body.password,
    role: body.role,
  });
  await startSession(idToken, refreshIdToken);
  return { user: toClientUser(account) };
});
