import { listServices } from "@/lib/server/data/publicData";
import ServiceCard from "./ServiceCard";

export default async function ServiceList() {
  const services = await listServices();

  return (
    <section className="flex justify-center items-center min-h-[50vh]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.key} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
