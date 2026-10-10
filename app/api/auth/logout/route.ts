import { handleApi } from "@/lib/server/http";
import { endSession } from "@/lib/server/session";

export const POST = handleApi(async () => {
  await endSession();
  return { ok: true };
});
