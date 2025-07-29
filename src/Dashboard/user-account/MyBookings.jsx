import { useContext, useEffect, useState } from "react";
import { authContext } from "../../context/AuthContext";
import { getDatabase, ref, get } from "firebase/database";
import Loading from "../../Components/Loader/Loading";
import Error from "../../Components/Error/Error";
import { doctor_URL } from "../../config";

const MyBookings = () => {
  const { userId } = useContext(authContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setError("Please log in to view your bookings.");
      setLoading(false);
      return;
    }

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const db = getDatabase();
        const appointmentsRef = ref(db, "appointments");
        const appointmentsSnapshot = await get(appointmentsRef);

        if (!appointmentsSnapshot.exists()) {
          setAppointments([]);
          setLoading(false);
          return;
        }

        const appointmentData = Object.values(appointmentsSnapshot.val() || {});
        const userAppointments = appointmentData.filter(
          (app) => app.user?.id === userId && app.state === "un"
        );

        if (userAppointments.length === 0) {
          setAppointments([]);
          setLoading(false);
          return;
        }

        const doctorsSnapshot = await get(ref(db, "doctors"));
        const doctorsData = doctorsSnapshot.exists()
          ? Object.values(doctorsSnapshot.val())
          : [];

        const enrichedAppointments = await Promise.all(
          userAppointments.map(async (appointment) => {
            const doctorId =
              appointment.doctorId ||
              (appointment.doctor && appointment.doctor.id) ||
              "unknown";

            const doctorData = doctorsData.find((doc) => doc.id === doctorId);

            if (!doctorData) {
              console.warn(
                `Doctor not found for ID: ${doctorId}. Please check the 'doctors' node in Firebase.`
              );
              return {
                ...appointment,
                doctor: {
                  id: doctorId,
                  name: "Unknown Doctor",
                  photo:
                    "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg",
                  phone: "Not available",
                },
              };
            }

            return {
              ...appointment,
              doctor: {
                id: doctorId,
                name: doctorData.name || "Unknown Doctor",
                photo:
                  doctorData.photo ||
                  "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg",
                phone: doctorData.phone || "Not available",
              },
            };
          })
        );

        setAppointments(enrichedAppointments);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(
          err.message === "Permission denied"
            ? "Please log in to view your bookings."
            : err.message || "Failed to fetch appointments"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [userId]);

  const formatExpectedTime = (time) => {
    if (!time || time.includes("NaN") || time === "Not specified") {
      return "Not specified";
    }
    return time;
  };

  return (
    <div className="mt-3">
      {loading && !error && <Loading />}
      {error && !loading && <Error errMessage={error} />}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 border border-gray-200 rounded-md shadow-sm"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={
                      appointment.doctor?.photo ||
                      "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"
                    }
                    alt="Doctor"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-lg font-semibold text-headingColor">
                      Doctor: {appointment.doctor?.name || "Unknown Doctor"}
                    </p>
                    <p className="text-textColor">
                      Patient: {appointment.user?.name || "Unknown User"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-textColor">
                    <span className="font-semibold">Ticket Price:</span>{" "}
                    {appointment.ticketPrice || "N/A"} BDT
                  </p>
                  <p className="text-textColor">
                    <span className="font-semibold">Time Slot:</span>{" "}
                    {appointment.timeSlot || "Not specified"}
                  </p>
                  <p className="text-textColor">
                    <span className="font-semibold">Queue Number:</span>{" "}
                    {appointment.queueNumber || "Not assigned"}
                  </p>
                  <p className="text-textColor">
                    <span className="font-semibold">Expected Visit Time:</span>{" "}
                    {formatExpectedTime(appointment.expectedTime)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <h2 className="mt-5 text-[20px] leading-7 text-center font-semibold text-primaryColor">
              You haven't booked any active appointments yet!
            </h2>
          )}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
