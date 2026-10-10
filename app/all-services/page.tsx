import ServicesManagementTable from "@/components/dashboard/admin/ServicesManagementTable";
import { listServices } from "@/lib/server/data/publicData";
import { requirePageSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";
import { privatePageMetadata } from "@/lib/shared/site";

export const metadata = privatePageMetadata("Services Management");

export default async function AllServicesPage() {
  await requirePageSession([ROLES.admin]);
  const services = await listServices();
  return <ServicesManagementTable initialServices={services} />;
}
