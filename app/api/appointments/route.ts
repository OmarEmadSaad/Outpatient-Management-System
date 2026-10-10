import { createAppointmentForPatient } from "@/lib/server/data/appointments";
import { handleApi, readJsonBody } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rateLimit";
import { requireApiSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";

export const POST = handleApi(async (request) => {
  const session = await requireApiSession([ROLES.patient]);
  const body = await readJsonBody(request);
  await enforceRateLimit(`booking:${session.uid}`, {
    windowMs: 10 * 60 * 1000,
    limit: 10,
  });
  const appointment = await createAppointmentForPatient(session, {
    doctorId: body.doctorId,
    timeSlot: body.timeSlot,
  });
  return { appointment };
});
