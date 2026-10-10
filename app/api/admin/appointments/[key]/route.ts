import { readAppointmentUpdate } from "@/lib/server/data/admin";
import {
  getAppointment,
  removeAppointment,
  updateAppointmentFields,
} from "@/lib/server/data/appointments";
import {
  HttpError,
  handleApi,
  readJsonBody,
  type RouteContext,
} from "@/lib/server/http";
import { requireApiSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";

type Params = { key: string };

const loadAppointment = async (context: RouteContext<Params>) => {
  const { key } = await context.params;
  const appointment = await getAppointment(key);
  if (!appointment) throw new HttpError(404, "Appointment not found");
  return appointment;
};

export const PATCH = handleApi<unknown, Params>(async (request, context) => {
  await requireApiSession([ROLES.admin]);
  const appointment = await loadAppointment(context);
  const updates = readAppointmentUpdate(await readJsonBody(request));
  await updateAppointmentFields(appointment.key, updates);
  return { appointment: { ...appointment, ...updates } };
});

export const DELETE = handleApi<{ ok: boolean }, Params>(
  async (_request, context) => {
    await requireApiSession([ROLES.admin]);
    const appointment = await loadAppointment(context);
    await removeAppointment(appointment.key);
    return { ok: true };
  }
);
