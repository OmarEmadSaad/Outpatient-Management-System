import {
  getAppointment,
  removeAppointment,
} from "@/lib/server/data/appointments";
import { HttpError, handleApi } from "@/lib/server/http";
import { requireApiSession } from "@/lib/server/session";
import { appointmentBelongsToDoctor } from "@/lib/shared/booking";
import { ROLES } from "@/lib/shared/roles";

export const DELETE = handleApi<{ ok: boolean }, { key: string }>(
  async (_request, context) => {
    const session = await requireApiSession([ROLES.doctor]);
    const { key } = await context.params;
    const appointment = await getAppointment(key);
    const doctorId = session.record.id || session.key;

    if (!appointment || !appointmentBelongsToDoctor(appointment, doctorId)) {
      throw new HttpError(404, "Appointment not found.");
    }

    await removeAppointment(appointment.key);
    return { ok: true };
  }
);
