import { requestPasswordReset } from "@/lib/server/authFlows";
import { clientIp, handleApi, readJsonBody } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { normalizeEmail } from "@/lib/shared/validation";

const WINDOW = { windowMs: 60 * 60 * 1000 };

export const POST = handleApi(async (request) => {
  const body = await readJsonBody(request);
  await enforceRateLimit(`reset-ip:${clientIp(request)}`, {
    ...WINDOW,
    limit: 10,
  });
  await enforceRateLimit(`reset-email:${normalizeEmail(body.email)}`, {
    ...WINDOW,
    limit: 3,
  });

  try {
    await requestPasswordReset(body.email);
  } catch (error) {
    console.error("Password reset request failed:", error);
  }
  return {
    message:
      "If an account exists for this email, a password reset link has been sent.",
  };
});
