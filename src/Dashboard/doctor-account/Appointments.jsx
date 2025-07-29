import { useState, useEffect } from "react";
import { formateDate } from "../../utils/formateData";
import Swal from "sweetalert2";
import { ref, remove } from "firebase/database";
import Loading from "../../Components/Loader/Loading";
import Error from "../../Components/Error/Error";
import UseFetchDate from "../../hooks/UseFetchDate";
import { db } from "../../../firebase/config";

const Appointments = () => {
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  const {
    data: appointmentsFromHook,
    loading,
    error,
  } = UseFetchDate("appointments");

  const [localAppointments, setLocalAppointments] = useState([]);

  useEffect(() => {
    if (appointmentsFromHook && Array.isArray(appointmentsFromHook)) {
      setLocalAppointments(appointmentsFromHook);
    } else if (
      appointmentsFromHook &&
      typeof appointmentsFromHook === "object" &&
      appointmentsFromHook !== null
    ) {
      const appointmentsArray = Object.keys(appointmentsFromHook).map(
        (key) => ({
          id: key,
          ...appointmentsFromHook[key],
        })
      );
      setLocalAppointments(appointmentsArray);
    } else {
      setLocalAppointments([]);
    }
  }, [appointmentsFromHook]);

  if (!role || !userId) {
    return (
      <div className="text-center py-6 text-red-600">
        Please log in or ensure user data is available.
      </div>
    );
  }

  if (loading && !error) {
    return <Loading />;
  }

  if (error && !loading) {
    return <Error errMessage={error || "Failed to fetch appointments"} />;
  }

  const filteredAppointments = localAppointments.filter((appointment) => {
    if (role === "doctor") {
      const doctorIdFromAppointment = appointment.doctor?.doctorId;
      return doctorIdFromAppointment === userId && appointment.state === "un";
    }

    if (role === "patient") {
      const patientIdFromAppointment = appointment.user?.id;
      return patientIdFromAppointment === userId;
    }

    return false;
  });

  if (filteredAppointments.length === 0 && !loading && !error) {
    return (
      <div className="text-center py-6 text-gray-600">
        No pending appointments available for you.
      </div>
    );
  }

  const handleComplete = async (appointmentId) => {
    const result = await Swal.fire({
      title: "Confirm Visit",
      text: "Are you sure this appointment has been completed? It will be removed permanently.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, confirm",
      cancelButtonText: "No, cancel",
    });

    if (result.isConfirmed) {
      try {
        const appointmentRef = ref(db, `appointments/${appointmentId}`);
        await remove(appointmentRef); // Delete from Firebase

        Swal.fire({
          title: "Completed!",
          text: "The appointment has been marked as completed and removed.",
          icon: "success",
          confirmButtonColor: "#3085d6",
        });

        setLocalAppointments((prevAppointments) =>
          prevAppointments.filter((app) => app.id !== appointmentId)
        );
      } catch (error) {
        console.error("Error completing and deleting appointment:", error);
        Swal.fire({
          title: "Error!",
          text:
            error.message ||
            "Failed to complete appointment. Please try again.",
          icon: "error",
          confirmButtonColor: "#d33",
        });
      }
    }
  };

  const handleDelete = async (appointmentId) => {
    const result = await Swal.fire({
      title: "Cancel Appointment",
      text: "Are you sure you want to cancel this appointment? It will be removed permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        const appointmentRef = ref(db, `appointments/${appointmentId}`);
        await remove(appointmentRef);

        Swal.fire({
          title: "Removed!",
          text: "The appointment has been removed.",
          icon: "success",
          confirmButtonColor: "#3085d6",
        });

        setLocalAppointments((prevAppointments) =>
          prevAppointments.filter((app) => app.id !== appointmentId)
        );
      } catch (error) {
        console.error("Error canceling and deleting appointment:", error);
        Swal.fire({
          title: "Error!",
          text:
            error.message || "Failed to cancel appointment. Please try again.",
          icon: "error",
          confirmButtonColor: "#d33",
        });
      }
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1000px] sm:min-w-[110%]">
        <table className="w-full table-auto text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 sm:px-2 py-3">Booked on</th>
              <th className="px-4 py-3 sm:text-center text-center pr-[2em] sm:pr-0">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((items) => (
                <tr key={items.id}>
                  <td className="px-4 py-4 whitespace-nowrap flex items-center">
                    <img
                      src={
                        items.user?.photo || "https://via.placeholder.com/50"
                      }
                      alt=""
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {items.user?.name || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {items.user?.email || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{items.user?.gender || "N/A"}</td>
                  <td className="px-4 py-4">
                    {items.isPaid ? (
                      <span className="flex items-center text-yellow-600">
                        <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full mr-2"></span>
                        Waiting
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2"></span>
                        Unpaid
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">{items.ticketPrice || "N/A"}</td>
                  <td className="px-4 sm:px-0 py-4">
                    {formateDate(items.createdAt)}
                  </td>
                  <td className="px-4 py-4 flex items-center space-x-2 justify-center">
                    {items.state === "un" ? (
                      <div className="flex space-x-2 mb-5">
                        <button
                          onClick={() => handleComplete(items.id)}
                          className="bg-blue-500 hover:cursor-pointer text-white text-xs px-3 py-1 rounded whitespace-nowrap"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleDelete(items.id)}
                          className="bg-red-500 hover:cursor-pointer text-white text-xs px-3 py-1 rounded whitespace-nowrap"
                        >
                          Not Come
                        </button>
                      </div>
                    ) : (
                      <span className="flex items-center text-green-600">
                        <span
                          className={`w-2.5 h-2.5 ${
                            items.state === "done"
                              ? "bg-green-500"
                              : "bg-red-500"
                          } rounded-full mr-2`}
                        ></span>
                        {items.state === "done" ? "Completed" : "Not Come"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center px-4 py-6">
                  No appointments available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Appointments;
