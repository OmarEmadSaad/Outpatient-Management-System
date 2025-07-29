import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";
import { authContext } from "../../context/AuthContext";
import { ref, get, child } from "firebase/database";
import { db } from "../../../firebase/config";

const Profile = () => {
  const { userId, role } = useContext(authContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: { total: 0, lastActiveUser: null },
    doctors: { total: 0, lastActiveDoctor: null },
    services: { total: 0, lastService: null },
    appointments: { total: 0, lastAppointment: null },
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId || userId === "null" || userId === "") {
        toast.error("Please log in to view statistics");
        navigate("/login");
        return;
      }

      if (role !== "admin") {
        toast.error("Access denied. Admin role required.");
        navigate("/home");
        return;
      }

      setLoading(true);
      try {
        const dbRef = ref(db);
        const usersSnapshot = await get(child(dbRef, "users"));
        const usersData = [];
        if (usersSnapshot.exists()) {
          usersSnapshot.forEach((childSnapshot) => {
            usersData.push({ id: childSnapshot.key, ...childSnapshot.val() });
          });
        }
        const patients = usersData.filter(
          (user) => user.role === "patient" || !user.role
        );

        const doctorsSnapshot = await get(child(dbRef, "doctors"));
        const doctorsData = [];
        if (doctorsSnapshot.exists()) {
          doctorsSnapshot.forEach((childSnapshot) => {
            doctorsData.push({ id: childSnapshot.key, ...childSnapshot.val() });
          });
        }

        const servicesSnapshot = await get(child(dbRef, "services"));
        const servicesData = [];
        if (servicesSnapshot.exists()) {
          servicesSnapshot.forEach((childSnapshot) => {
            servicesData.push({
              id: childSnapshot.key,
              ...childSnapshot.val(),
            });
          });
        }
        const lastService =
          servicesData.length > 0
            ? servicesData[servicesData.length - 1]
            : null;

        const appointmentsSnapshot = await get(child(dbRef, "appointments"));
        const appointmentsData = [];
        if (appointmentsSnapshot.exists()) {
          appointmentsSnapshot.forEach((childSnapshot) => {
            appointmentsData.push({
              id: childSnapshot.key,
              ...childSnapshot.val(),
            });
          });
        }
        const lastAppointment = appointmentsData.reduce((latest, appt) => {
          const currentCreatedAt = appt.createdAt
            ? new Date(appt.createdAt)
            : null;
          const latestCreatedAt = latest?.createdAt
            ? new Date(latest.createdAt)
            : null;

          return currentCreatedAt &&
            (!latestCreatedAt || currentCreatedAt > latestCreatedAt)
            ? appt
            : latest;
        }, null);

        const lastActiveUser = lastAppointment
          ? patients.find((user) => user.id === lastAppointment.user?.id)
          : null;
        const lastActiveDoctor = lastAppointment?.doctor?.doctorId
          ? doctorsData.find(
              (doctor) => doctor.id === lastAppointment.doctor.doctorId
            )
          : null;

        setStats({
          users: {
            total: patients.length,
            lastActiveUser: lastActiveUser
              ? { ...lastActiveUser, lastActive: lastAppointment.createdAt }
              : null,
          },
          doctors: {
            total: doctorsData.length,
            lastActiveDoctor: lastActiveDoctor
              ? { ...lastActiveDoctor, lastActive: lastAppointment.createdAt }
              : null,
          },
          services: {
            total: servicesData.length,
            lastService: lastService,
          },
          appointments: {
            total: appointmentsData.length,
            lastAppointment,
          },
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast.error("Failed to load statistics: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId, role, navigate]);

  return (
    <div className="container mx-auto px-4 py-10">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <HashLoader size={50} color="#0066ff" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-headingColor mb-4">
              Patients
            </h2>
            <p className="text-lg text-textColor">
              Total Patients:{" "}
              <span className="font-semibold">{stats.users.total}</span>
            </p>
            <p className="text-lg text-textColor">
              Last Active:
              <span className="font-semibold">
                {stats.users.lastActiveUser ? (
                  <>
                    {stats.users.lastActiveUser.name} (
                    {stats.users.lastActiveUser.lastActive
                      ? new Date(
                          stats.users.lastActiveUser.lastActive
                        ).toLocaleString()
                      : "Not available"}
                    )
                  </>
                ) : (
                  "Not available"
                )}
              </span>
            </p>
            <button
              onClick={() => navigate("/patients")}
              className="mt-4 btn btn-accent text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700"
            >
              View Details
            </button>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-headingColor mb-4">
              Doctors
            </h2>
            <p className="text-lg text-textColor">
              Total Doctors:{" "}
              <span className="font-semibold">{stats.doctors.total}</span>
            </p>
            <p className="text-lg text-textColor">
              Last Active:
              <span className="font-semibold">
                {stats.doctors.lastActiveDoctor ? (
                  <>
                    {stats.doctors.lastActiveDoctor.name} (
                    {stats.doctors.lastActiveDoctor.lastActive
                      ? new Date(
                          stats.doctors.lastActiveDoctor.lastActive
                        ).toLocaleString()
                      : "N/A"}
                    )
                  </>
                ) : (
                  "N/A"
                )}
              </span>
            </p>
            <button
              onClick={() => navigate("/doctors-edite")}
              className="mt-4 btn btn-accent text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700"
            >
              View Details
            </button>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-headingColor mb-4">
              Services
            </h2>
            <p className="text-lg text-textColor">
              Total Services:{" "}
              <span className="font-semibold">{stats.services.total}</span>
            </p>
            <p className="text-lg text-textColor">
              Last Added:
              <span className="font-semibold">
                {stats.services.lastService?.name} (
                {stats.services.lastService?.createdAt
                  ? new Date(
                      stats.services.lastService.createdAt
                    ).toLocaleString()
                  : "N/A"}
                )
              </span>
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                navigate("/all-services");
              }}
              className="mt-4 btn btn-accent text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700"
            >
              View Details
            </button>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-headingColor mb-4">
              Appointments
            </h2>
            <p className="text-lg text-textColor">
              Total Appointments:{" "}
              <span className="font-semibold">{stats.appointments.total}</span>
            </p>
            <p className="text-lg text-textColor">
              Last Booked:
              <span className="font-semibold">
                {stats.appointments.lastAppointment ? (
                  <>
                    {stats.appointments.lastAppointment.user.name} (
                    {stats.appointments.lastAppointment.createdAt
                      ? new Date(
                          stats.appointments.lastAppointment.createdAt
                        ).toLocaleString()
                      : "N/A"}
                    )
                  </>
                ) : (
                  "N/A"
                )}
              </span>
            </p>
            <button
              onClick={() => navigate("/appointments")}
              className="mt-4 btn btn-accent text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700"
            >
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
