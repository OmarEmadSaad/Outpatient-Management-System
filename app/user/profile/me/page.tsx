import MyAccountView from "@/components/dashboard/patient/MyAccountView";
import { getPatientDashboard } from "@/lib/server/data/patientDashboard";
import { requirePageSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";
import { privatePageMetadata } from "@/lib/shared/site";

export const metadata = privatePageMetadata("My Account");

export default async function PatientAccountPage() {
  const session = await requirePageSession([ROLES.patient]);
  const { profile, bookings } = await getPatientDashboard(session);
  return <MyAccountView profile={profile} bookings={bookings} />;
}
