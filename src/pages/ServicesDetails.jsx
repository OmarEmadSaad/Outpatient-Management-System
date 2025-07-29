import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// Ensure you are importing the correct URLs from your config file
import { BASE_URL, token, doctor_URL } from "../config";
import Loading from "../Components/Loader/Loading";
import Error from "../Components/Error/Error";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ServicesDetails = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Corrected typo here from setoccasionedError

  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const serviceName = queryParams.get("service");

  useEffect(() => {
    if (!serviceName) {
      setError("No service specified in the URL.");
      setLoading(false); // Make sure to set loading to false if there's an early exit
      return;
    }

    const fetchDoctors = async () => {
      setLoading(true);
      setError(null); // Clear any previous errors

      try {
        // Use doctor_URL directly from config, which includes .json
        // For Firebase Realtime Database, typically you append ?auth=<token> to the URL
        const authParam = token ? `?auth=${token}` : "";
        const res = await fetch(`${doctor_URL}${authParam}`); // Use doctor_URL and append auth param

        // Firebase REST API returns 200 even if token is invalid, but data will be null if rules deny access.
        // It generally doesn't block with CORS if the URL is correct and rules are somewhat open.
        // If your rules block unauthenticated reads, `res.ok` might still be true but `doctorsData` will be empty.
        // Or if you get a 401/403, `res.ok` will be false.
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `Failed to fetch doctors: ${res.status} ${res.statusText} - ${errorText}`
          );
        }

        const doctorsObject = await res.json(); // Firebase returns an object of objects

        // Convert the object of doctors into an array
        // If doctorsObject is null (e.g., no data or authentication failed), default to an empty object.
        const allDoctors = doctorsObject ? Object.values(doctorsObject) : [];

        const userId = localStorage.getItem("userId");
        const role = localStorage.getItem("role");

        let filteredDoctors = allDoctors.filter(
          (doctor) =>
            doctor.specialization && // Ensure specialization exists
            doctor.specialization.toLowerCase() === serviceName.toLowerCase()
        );

        // Filter out the current doctor if the logged-in user is a doctor
        if (role === "doctor" && userId) {
          filteredDoctors = filteredDoctors.filter(
            (doctor) => doctor.id !== userId
          );
        }

        setDoctors(filteredDoctors);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError(
          err.message ||
            "Something went wrong while fetching doctors. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [serviceName, token]); // Add 'token' to dependencies if it can change and affect the fetch

  const handleBooking = (doctorId) => {
    try {
      const role = localStorage.getItem("role");

      if (!role) {
        toast.error("No user role found. Please sign in as a patient.");
        return;
      }

      if (role !== "patient") {
        toast.error("Sorry, booking is only available for patients.");
        toast.warn("Please sign up as a patient.");
        return;
      }

      navigate(`/doctors/${doctorId}`);
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("An error occurred while navigating to the booking page.");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-[28px] font-bold text-headingColor text-center mb-8">
        Doctors for {serviceName || "Service"}
      </h2>

      {loading && !error && <Loading />}
      {error && !loading && <Error errMessage={error} />}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.length > 0 ? (
            doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="card bg-base-100 w-full max-w-[384px] shadow-sm mx-auto"
              >
                <figure className="px-10 pt-10">
                  <img
                    src={doctor.photo}
                    alt={doctor.name}
                    className="rounded-xl w-full h-[200px] object-cover"
                  />
                </figure>
                <div className="card-body items-center text-center">
                  <h2 className="card-title text-[20px] font-semibold text-headingColor">
                    {doctor.name}
                  </h2>
                  <p className="text-textColor">{doctor.specialization}</p>
                  <div className="card-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleBooking(doctor.id)}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-textColor col-span-full">
              No doctors found for this service.
            </p>
          )}
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ServicesDetails;
