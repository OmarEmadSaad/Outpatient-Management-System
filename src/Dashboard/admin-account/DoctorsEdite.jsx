import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL, token } from "../../config";
import Swal from "sweetalert2";

const DOCTORS_API_URL = `${BASE_URL}/doctors`;

const DoctorsEdite = () => {
  const [doctors, setDoctors] = useState([]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${DOCTORS_API_URL}.json`);
      const data = response.data;

      const fetchedDoctors = [];
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          fetchedDoctors.push({
            firebaseKey: key,
            id: data[key].id,
            ...data[key],
          });
        }
      }
      setDoctors(fetchedDoctors);
    } catch (err) {
      console.error("Error fetching doctors:", err);
      Swal.fire({
        title: "Error!",
        text: `Failed to load doctors: ${err.message}`,
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleDelete = async (event, firebaseKey, name) => {
    event.preventDefault();

    const result = await Swal.fire({
      title: "Confirm Deletion",
      text: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      if (!token) {
        throw new Error("Please log in to delete doctors.");
      }

      const response = await axios.delete(
        `${DOCTORS_API_URL}/${firebaseKey}.json?auth=${token}`
      );

      setDoctors((prev) =>
        prev.filter((doctor) => doctor.firebaseKey !== firebaseKey)
      );

      Swal.fire({
        title: "Deleted!",
        text: `${name} has been deleted.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire({
        title: "Error!",
        text: `Failed to delete ${name}: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-blue-600 text-center">
        Doctors Management
      </h1>
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-blue-100 text-left text-blue-800">
              <th className="py-3 px-4 border-b border-gray-200 font-semibold text-sm">
                ID
              </th>
              <th className="py-3 px-4 border-b border-gray-200 font-semibold text-sm">
                Photo
              </th>
              <th className="py-3 px-4 border-b border-gray-200 font-semibold text-sm">
                Name
              </th>
              <th className="py-3 px-4 border-b border-gray-200 font-semibold text-sm">
                Email
              </th>
              <th className="py-3 px-4 border-b border-gray-200 font-semibold text-sm">
                Gender
              </th>
              <th className="py-3 px-4 border-b border-gray-200 font-semibold text-sm">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <tr
                key={doctor.firebaseKey}
                className="hover:bg-gray-100 transition-colors duration-200 ease-in-out"
              >
                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-700">
                  {doctor.id}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-700">
                  <img
                    src={doctor.photo}
                    alt={doctor.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://placehold.co/48x48/cccccc/000000?text=No+Img";
                    }}
                  />
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-700">
                  {doctor.name}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-700">
                  {doctor.email}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-700 capitalize">
                  {doctor.gender || "N/A"}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                  <button
                    onClick={(e) =>
                      handleDelete(e, doctor.firebaseKey, doctor.name)
                    }
                    className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out shadow-md hover:shadow-lg"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-6 text-gray-500 text-lg"
                >
                  No doctors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorsEdite;
