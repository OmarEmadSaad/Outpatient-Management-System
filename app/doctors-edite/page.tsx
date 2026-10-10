import DoctorsManagementTable from "@/components/dashboard/admin/DoctorsManagementTable";
import { listDoctorsForAdmin } from "@/lib/server/data/admin";
import { requirePageSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";
import { privatePageMetadata } from "@/lib/shared/site";

export const metadata = privatePageMetadata("Doctors Management");

export default async function DoctorsManagementPage() {
  await requirePageSession([ROLES.admin]);
  const doctors = await listDoctorsForAdmin();
  return <DoctorsManagementTable initialDoctors={doctors} />;
}
