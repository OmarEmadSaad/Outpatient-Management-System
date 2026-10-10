import AdminAppointmentsBoard from "@/components/dashboard/admin/AdminAppointmentsBoard";
import { listAllAppointments } from "@/lib/server/data/appointments";
import { requirePageSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";
import { privatePageMetadata } from "@/lib/shared/site";

export const metadata = privatePageMetadata("All Appointments");

export default async function AppointmentsPage() {
  await requirePageSession([ROLES.admin]);
  const appointments = await listAllAppointments();
  return <AdminAppointmentsBoard initialAppointments={appointments} />;
}
