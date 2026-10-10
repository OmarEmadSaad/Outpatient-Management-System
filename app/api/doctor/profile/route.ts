import { CACHE_TAGS, invalidate } from "@/lib/server/data/cacheTags";
import { updateDoctorProfile } from "@/lib/server/data/profiles";
import { listServices } from "@/lib/server/data/publicData";
import { handleApi, readJsonBody } from "@/lib/server/http";
import { requireApiSession } from "@/lib/server/session";
import { ROLES } from "@/lib/shared/roles";

export const PATCH = handleApi(async (request) => {
  const session = await requireApiSession([ROLES.doctor]);
  const body = await readJsonBody(request);
  const services = await listServices();
  const result = await updateDoctorProfile(
    session,
    body,
    services.map((service) => service.name)
  );
  if (result.changed) invalidate(CACHE_TAGS.doctors);
  return result;
});
