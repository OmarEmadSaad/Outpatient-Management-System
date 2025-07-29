import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import { authContext } from "../../context/AuthContext";
import { BASE_URL } from "../../config";
import Swal from "sweetalert2";

const Appointments = () => {
  const { userId, role, token: authToken } = useContext(authContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editForm, setEditForm] = useState({
    timeSlot: "",
    ticketPrice: "",
    state: "",
  });
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || userId === "null" || userId === "") {
        toast.error("Please log in to view appointments");
        navigate("/login");
        return;
      }

      if (role !== "admin") {
        toast.error("Access denied. Admin role required.");
        navigate("/home");
        return;
      }

      if (!authToken) {
        toast.error("Authentication token is missing. Please log in again.");
        navigate("/login");
        return;
      }

      setLoading(true);
      try {
        const appointmentsRes = await fetch(
          `${BASE_URL}/appointments.json?auth=${authToken}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        if (!appointmentsRes.ok) {
          const errorText = await appointmentsRes.text();
          throw new Error(errorText || "Failed to fetch appointments");
        }
        const appointmentsData = await appointmentsRes.json();

        const doctorsRes = await fetch(
          `${BASE_URL}/doctors.json?auth=${authToken}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        if (!doctorsRes.ok) {
          const errorText = await doctorsRes.text();
          throw new Error(errorText || "Failed to fetch doctors");
        }
        const doctorsData = await doctorsRes.json();

        const enrichedAppointments = Object.keys(appointmentsData || {}).map(
          (key) => ({
            firebaseKey: key,
            ...appointmentsData[key],
            doctorEmail:
              Object.values(doctorsData || {}).find(
                (d) => d.id === appointmentsData[key].doctorId
              )?.email || "N/A",
          })
        );

        const doctorsArray = Object.keys(doctorsData || {}).map((key) => ({
          firebaseKey: key,
          ...doctorsData[key],
        }));

        setAppointments(enrichedAppointments);
        setDoctors(doctorsArray);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load appointments: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, role, authToken, navigate]);

  const handleCardClick = (appointment) => {
    setSelectedAppointment(appointment);
    setEditForm({
      timeSlot: appointment.timeSlot || "",
      ticketPrice: appointment.ticketPrice || "",
      state: appointment.state || "un",
    });
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setEditForm({ timeSlot: "", ticketPrice: "", state: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!selectedAppointment || !selectedAppointment.firebaseKey) {
      toast.error("No appointment selected or invalid appointment key");
      return;
    }

    if (!editForm.timeSlot.trim()) {
      toast.error("Time slot is required");
      return;
    }
    if (
      !editForm.ticketPrice ||
      isNaN(editForm.ticketPrice) ||
      editForm.ticketPrice < 0
    ) {
      toast.error("Invalid ticket price");
      return;
    }
    if (!["un", "done", "not come"].includes(editForm.state)) {
      toast.error("Invalid state");
      return;
    }

    const updates = {};
    if (editForm.timeSlot !== selectedAppointment.timeSlot) {
      updates.timeSlot = editForm.timeSlot;
    }
    if (editForm.ticketPrice !== selectedAppointment.ticketPrice) {
      updates.ticketPrice = editForm.ticketPrice;
    }
    if (editForm.state !== selectedAppointment.state) {
      updates.state = editForm.state;
    }

    if (Object.keys(updates).length === 0) {
      toast.info("No changes to save");
      closeModal();
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/appointments/${selectedAppointment.firebaseKey}.json?auth=${authToken}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update appointment");
      }

      const updatedAppointment = await response.json();

      setAppointments((prevAppointments) =>
        prevAppointments.map((appt) =>
          appt.firebaseKey === selectedAppointment.firebaseKey
            ? { ...appt, ...updatedAppointment }
            : appt
        )
      );

      toast.success("Appointment updated successfully");
      closeModal();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update appointment: " + error.message);
    }
  };

  const handleDelete = async (firebaseKey) => {
    const appointment = appointments.find(
      (appt) => appt.firebaseKey === firebaseKey
    );
    if (!appointment) {
      toast.error("Appointment not found");
      return;
    }

    const result = await Swal.fire({
      title: "Confirm Deletion",
      text: `Are you sure you want to delete the appointment for ${appointment.user.name}? This action cannot be undone.`,
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
      const response = await fetch(
        `${BASE_URL}/appointments/${firebaseKey}.json?auth=${authToken}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete appointment");
      }

      setAppointments((prevAppointments) =>
        prevAppointments.filter((appt) => appt.firebaseKey !== firebaseKey)
      );

      toast.success("Appointment deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete appointment: " + error.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <HashLoader size={40} color="#0066ff" />
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-headingColor mb-6">
            All Appointments
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {appointments.length === 0 ? (
              <p className="text-base text-textColor col-span-full">
                No appointments available.
              </p>
            ) : (
              appointments.map((appt) => (
                <div
                  key={appt.firebaseKey}
                  className="bg-white shadow-md rounded-lg p-4 border border-gray-200 transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-headingColor mb-1">
                    {appt.user.name}
                  </h3>
                  <p className="text-sm text-textColor">
                    Doctor:{" "}
                    <span className="font-medium">{appt.doctor.name}</span>
                  </p>
                  <p className="text-sm text-textColor">
                    Date:{" "}
                    <span className="font-medium">
                      {new Date(appt.createdAt).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-sm text-textColor">
                    State:{" "}
                    <span className="font-medium capitalize">
                      {appt.state === "not come"
                        ? "Not Attended"
                        : appt.state === "un"
                        ? "Unconfirmed"
                        : "Completed"}
                    </span>
                  </p>
                  <div className="mt-3 flex justify-between">
                    <button
                      onClick={() => handleCardClick(appt)}
                      className="text-sm text-blue-600 hover:underline hover:cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleDelete(appt.firebaseKey)}
                      className="text-sm text-red-600 hover:underline hover:cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedAppointment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                <h2 className="text-xl font-bold text-headingColor mb-4">
                  Appointment Details
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b pb-1">
                    <span className="font-medium text-textColor">
                      Appointment ID:
                    </span>
                    <span>{selectedAppointment.id}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b pb-1">
                    <span className="font-medium text-textColor">
                      Patient Name:
                    </span>
                    <span>{selectedAppointment.user.name}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b pb-1">
                    <span className="font-medium text-textColor">
                      Doctor Name:
                    </span>
                    <span>{selectedAppointment.doctor.name}</span>
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <label className="text-sm">Time Slot:</label>
                    <input
                      type="text"
                      name="timeSlot"
                      value={editForm.timeSlot}
                      onChange={handleInputChange}
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <label className="text-sm">Ticket Price:</label>
                    <input
                      type="number"
                      name="ticketPrice"
                      value={editForm.ticketPrice}
                      onChange={handleInputChange}
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <label className="text-sm">State:</label>
                    <select
                      name="state"
                      value={editForm.state}
                      onChange={handleInputChange}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="un">Unconfirmed</option>
                      <option value="done">Completed</option>
                      <option value="not come">Not Attended</option>
                    </select>
                  </div>
                  <div className="flex justify-end mt-4 gap-3">
                    <button
                      onClick={handleSave}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 hover:cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={closeModal}
                      className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Appointments;
