import PatientsTable from "@/components/dashboard/admin/PatientsTable";
import { listManagedUsers } from "@/lib/server/data/admin";
import { requirePageSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";
import { privatePageMetadata } from "@/lib/shared/site";

export const metadata = privatePageMetadata("Patients");

export default async function PatientsPage() {
  const session = await requirePageSession([ROLES.admin]);
  const { patients, admins } = await listManagedUsers(
    session.collection === "users" ? session.key : null
  );
  return <PatientsTable initialPatients={patients} initialAdmins={admins} />;
}
