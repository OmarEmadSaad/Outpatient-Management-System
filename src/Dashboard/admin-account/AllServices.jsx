import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { service_URL, BASE_URL, token } from "../../config";
import Loading from "../../Components/Loader/Loading";

const AllServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(service_URL);

        if (response.status >= 300 && response.status < 400) {
          console.warn("Redirect detected in GET /services:", response.status);
          throw new Error("Unexpected redirect from server");
        }

        if (response.data) {
          const servicesArray = Object.keys(response.data).map((key) => ({
            id: response.data[key].id,
            firebaseKey: key,
            ...response.data[key],
          }));
          setServices(servicesArray);
        } else {
          setServices([]);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        Swal.fire({
          title: "Error!",
          text:
            "Failed to fetch services: " + (error.message || "Unknown error"),
          icon: "error",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [navigate]);

  const handleDelete = async (event, firebaseKey, name) => {
    event.preventDefault();

    const result = await Swal.fire({
      title: "Delete Confirmation",
      text: `Are you sure you want to delete the service "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    if (!result.isConfirmed) return;

    try {
      if (!token) {
        throw new Error("Please log in to delete services.");
      }

      const deleteServiceURL = `${BASE_URL}/services/${firebaseKey}.json?auth=${token}`;
      const response = await axios.delete(deleteServiceURL);

      if (response.status >= 300 && response.status < 400) {
        console.warn("Redirect detected in DELETE request:", response.status);
        throw new Error("Unexpected redirect from server");
      }

      setServices((prev) =>
        prev.filter((service) => service.firebaseKey !== firebaseKey)
      );
      Swal.fire({
        title: "Deleted!",
        text: `Service "${name}" has been deleted successfully.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire({
        title: "Error!",
        text: `Failed to delete service "${name}": ${error.message}`,
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-blue-400">
        Services Management
      </h1>
      <div className="mt-2 mb-2 text-center">
        <button
          onClick={() => navigate("/services/add")}
          className="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded hover:cursor-pointer mx-1"
        >
          Add Services
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-right">
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b text-center">Image</th>
              <th className="py-2 px-4 border-b">Service Name</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No services available.
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.firebaseKey} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b text-right">
                    {service.id}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <img
                      src={
                        service.image ||
                        "https://webemps.com/images/default-image.jpg"
                      }
                      alt={service.name}
                      className="w-12 h-12 rounded-full object-cover mx-auto"
                    />
                  </td>
                  <td className="py-2 px-4 border-b text-right">
                    {service.name}
                  </td>
                  <td className="py-2 px-4 border-b text-right">
                    {service.desc?.substring(0, 20) +
                      (service.desc?.length > 20 ? "..." : "")}
                  </td>
                  <td className="py-2 px-4 border-b text-right gap-[2em]">
                    <button
                      onClick={(e) =>
                        handleDelete(e, service.firebaseKey, service.name)
                      }
                      className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded hover:cursor-pointer mx-1"
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/services/${service.id}`);
                      }}
                      className="text-white mt-2 bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded hover:cursor-pointer mx-1"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllServices;
