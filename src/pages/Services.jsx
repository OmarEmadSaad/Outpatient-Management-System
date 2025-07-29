import { useEffect, useState } from "react";
import ServiceCard from "../Components/Services/ServiceCard";
import { BASE_URL, token } from "../config";

function Services() {
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${BASE_URL}/services.json?auth=${token}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Failed to fetch services");
        }

        const data = await res.json();

        const servicesArray = data
          ? Object.keys(data).map((key) => ({
              firebaseKey: key,
              ...data[key],
            }))
          : [];

        setServices(servicesArray);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        setError(error.message);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="container mx-auto px-4 mt-5 mb-5">
      {error ? (
        <p className="text-red-500 text-center">Error: {error}</p>
      ) : services.length === 0 ? (
        <p className="text-gray-500 text-center">No services available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {services.map((items, index) => (
            <ServiceCard index={index} key={items.id || index} items={items} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Services;
