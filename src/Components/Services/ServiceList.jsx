import React, { useEffect, useState } from "react";
import ServiceCard from "./ServiceCard";
import { ref, onValue } from "firebase/database";
import { db } from "../../../firebase/config";

const ServiceList = () => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    const servicesRef = ref(db, "services");
    onValue(
      servicesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const servicesArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setServices(servicesArray);
        } else {
          setServices([]);
        }
      },
      (error) => {
        console.error("Failed to fetch services:", error);
      }
    );
  }, []);

  return (
    <section className="flex justify-center items-center min-h-[50vh]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((items, index) => (
            <ServiceCard key={items.id || index} items={items} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceList;
