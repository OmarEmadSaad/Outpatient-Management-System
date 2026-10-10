import StatCard from "@/components/dashboard/admin/StatCard";
import { getAdminStats } from "@/lib/server/data/admin";
import { requirePageSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";
import { privatePageMetadata } from "@/lib/shared/site";

export const metadata = privatePageMetadata("Admin Dashboard");

export default async function AdminProfilePage() {
  await requirePageSession([ROLES.admin]);
  const stats = await getAdminStats();
  const { users, doctors, services, appointments } = stats;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="sr-only">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <StatCard
          title="Patients"
          totalLabel="Total Patients"
          total={users.total}
          lastLabel="Last Active"
          name={users.lastActiveUser?.name ?? null}
          when={users.lastActiveUser?.lastActive}
          fallback="Not available"
          href="/patients"
        />
        <StatCard
          title="Doctors"
          totalLabel="Total Doctors"
          total={doctors.total}
          lastLabel="Last Active"
          name={doctors.lastActiveDoctor?.name ?? null}
          when={doctors.lastActiveDoctor?.lastActive}
          fallback="N/A"
          href="/doctors-edite"
        />
        <StatCard
          title="Services"
          totalLabel="Total Services"
          total={services.total}
          lastLabel="Last Added"
          name={services.lastService?.name ?? ""}
          when={services.lastService?.createdAt}
          fallback="N/A"
          href="/all-services"
        />
        <StatCard
          title="Appointments"
          totalLabel="Total Appointments"
          total={appointments.total}
          lastLabel="Last Booked"
          name={appointments.lastAppointment?.userName ?? null}
          when={appointments.lastAppointment?.createdAt}
          fallback="N/A"
          href="/appointments"
        />
      </div>
    </div>
  );
}
