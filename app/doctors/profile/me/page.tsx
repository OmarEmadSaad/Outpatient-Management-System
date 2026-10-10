import DoctorDashboardView from "@/components/dashboard/doctor/DoctorDashboardView";
import { listDoctorAppointments } from "@/lib/server/data/appointments";
import { text, toPublicDoctor } from "@/lib/server/data/projections";
import { getPublicDoctor, listServices } from "@/lib/server/data/publicData";
import { requirePageSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";
import { privatePageMetadata } from "@/lib/shared/site";

export const metadata = privatePageMetadata("Doctor Dashboard");

export default async function DoctorDashboardPage() {
  const session = await requirePageSession([ROLES.doctor]);
  const doctor = toPublicDoctor(session.key, session.record);

  const [appointments, services, publicDetails] = await Promise.all([
    listDoctorAppointments(doctor.id),
    listServices(),
    getPublicDoctor(doctor.id),
  ]);

  return (
    <DoctorDashboardView
      doctor={{
        ...doctor,
        email: text(session.record.email),
        phone: text(session.record.phone),
        averageRating: publicDetails?.averageRating || "0.0",
        totalRating: publicDetails?.totalRating || 0,
      }}
      appointments={appointments}
      serviceNames={services.map((service) => service.name)}
    />
  );
}
