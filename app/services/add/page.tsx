import ServiceForm from "@/components/dashboard/admin/ServiceForm";
import { requirePageSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";
import { privatePageMetadata } from "@/lib/shared/site";

export const metadata = privatePageMetadata("Add Service");

export default async function AddServicePage() {
  await requirePageSession([ROLES.admin]);
  return <ServiceForm />;
}
