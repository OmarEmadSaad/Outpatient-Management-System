import { notFound } from "next/navigation";
import ServiceForm from "@/components/dashboard/admin/ServiceForm";
import { findServiceById } from "@/lib/server/data/admin";
import { requirePageSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";
import { privatePageMetadata } from "@/lib/shared/site";

export const metadata = privatePageMetadata("Edit Service");

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageSession([ROLES.admin]);
  const { id } = await params;
  const service = await findServiceById(decodeURIComponent(id));
  if (!service) notFound();
  return <ServiceForm service={service} />;
}
