import Loader from "../../Components/Loader/Loading";
import Error from "../../Components/Error/Error";
import UseFetchDate from "../../hooks/UseFetchDate";
import { BASE_URL, doctor_URL } from "../../config";
import Tads from "./Tads";
import starIcon from "../../assets/images/Star.png";
import { useContext, useState, useEffect } from "react";
import DoctorAbout from "../../pages/Doctors/DoctorAbout";
import Profile from "./Profile";
import Appointments from "./Appointments";
import { authContext } from "../../context/AuthContext";

const Dashboard = () => {
  const {
    user,
    token: authToken,
    role,
    loading: authLoading,
  } = useContext(authContext);
  const currentUserId = user?.id;

  const [processedAllDoctors, setProcessedAllDoctors] = useState([]);
  const { data: rawDoctorsData, loading, error } = UseFetchDate(doctor_URL);

  const [doctorData, setDoctorData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (rawDoctorsData) {
      let doctorsArray = [];
      if (Array.isArray(rawDoctorsData)) {
        doctorsArray = rawDoctorsData;
      } else if (
        typeof rawDoctorsData === "object" &&
        rawDoctorsData !== null
      ) {
        doctorsArray = Object.keys(rawDoctorsData).map((key) => ({
          ...rawDoctorsData[key],
          id: rawDoctorsData[key].id || key,
        }));
      }
      setProcessedAllDoctors(doctorsArray);
    }
  }, [rawDoctorsData]);

  useEffect(() => {
    if (processedAllDoctors.length > 0 && currentUserId) {
      const foundDoctor = processedAllDoctors.find(
        (doc) => doc.id === currentUserId
      );
      setDoctorData(foundDoctor);

      if (foundDoctor) {
        const processedQualifications = Array.isArray(
          foundDoctor.qualifications
        )
          ? foundDoctor.qualifications
          : typeof foundDoctor.qualifications === "object" &&
            foundDoctor.qualifications !== null
          ? Object.values(foundDoctor.qualifications)
          : [];

        const processedExperiences = Array.isArray(foundDoctor.experiences)
          ? foundDoctor.experiences
          : typeof foundDoctor.experiences === "object" &&
            foundDoctor.experiences !== null
          ? Object.values(foundDoctor.experiences)
          : [];

        setDoctorData((prev) => ({
          ...prev,
          qualifications: processedQualifications,
          experiences: processedExperiences,
        }));

        if (
          foundDoctor?.appointments &&
          Array.isArray(foundDoctor.appointments)
        ) {
          setAppointments(foundDoctor.appointments);
        } else {
          setAppointments([]);
        }
      } else {
        setDoctorData(null);
        setAppointments([]);
      }
    } else {
      setDoctorData(null);
      setAppointments([]);
    }
  }, [processedAllDoctors, currentUserId]);

  if (authLoading || loading) {
    return (
      <section className="flex items-center justify-center min-h-screen">
        <Loader />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex items-center justify-center min-h-screen">
        <Error errMessage={error} />
      </section>
    );
  }

  if (!user || role !== "doctor") {
    return (
      <section>
        <div className="container text-center py-10">
          <h3 className="text-red-500 font-semibold text-lg">
            Access Denied! Please log in as a doctor to view this page.
          </h3>
        </div>
      </section>
    );
  }
  if (!doctorData && !loading) {
    return (
      <section>
        <div className="container text-center py-10">
          <h3 className="text-red-500 font-semibold text-lg">
            Doctor profile not found for the logged-in user.
          </h3>
          <p className="text-gray-600 mt-2">
            Please ensure your user ID matches a doctor entry in the database.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="max-w-[1170px] px-5 mx-auto">
        <div className="grid lg:grid-cols-3 gap-[30px] lg:gap-[50px]">
          <div className="lg:col-span-1">
            <Tads tab={tab} setTab={setTab} />
          </div>
          <div className="lg:col-span-2">
            {doctorData?.isApproved === "pending" && (
              <div className="flex p-4 mb-4 text-yellow-800 bg-yellow-50 rounded-lg">
                <div
                  role="alert"
                  className="alert alert-info flex items-center"
                >
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5 flex-shrink-0 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-3 text-sm font-medium">
                    To get approval, please complete your profile. Your
                    application is currently **Pending**.
                  </span>
                </div>
              </div>
            )}
            <div className="mt-5">
              {tab === "overview" && (
                <div>
                  <div className="mb-10 gap-4 flex flex-col sm:flex-row items-center">
                    <figure className="w-[150px] h-[150px] rounded-full overflow-hidden border-4 border-solid border-primaryColor">
                      <img
                        src={
                          doctorData?.photo || "https://via.placeholder.com/150"
                        }
                        className="w-full h-full object-cover"
                        alt="Doctor"
                      />
                    </figure>
                    <div className="text-center sm:text-left">
                      <span className="bg-[#CCF0F3] text-irisBlueColor px-4 py-1 rounded text-sm lg:text-base font-semibold">
                        {doctorData?.specialization || "N/A"}
                      </span>
                      <h3 className="text-2xl lg:text-3xl font-bold text-headingColor mt-3">
                        {doctorData?.name || "Doctor Name"}
                      </h3>
                      <div className="flex items-center gap-[6px] justify-center sm:justify-start mt-2">
                        <span className="flex items-center gap-[6px] text-headingColor text-sm lg:text-base font-semibold">
                          <img src={starIcon} alt="Star" className="w-4 h-4" />
                          {doctorData?.averageRating?.toFixed(1) || "0.0"}
                        </span>
                        <span className="text-sm lg:text-base font-semibold text-textColor">
                          ({doctorData?.totalRating || 0})
                        </span>
                      </div>
                      <p className="text__para font-[15px] leading-6 max-w-[400px] mt-2 text-center sm:text-left">
                        {doctorData?.bio || "No bio available."}
                      </p>
                    </div>
                  </div>
                  <DoctorAbout
                    name={doctorData?.name}
                    about={doctorData?.about}
                    qualifications={doctorData?.qualifications}
                    experiences={doctorData?.experiences}
                  />
                </div>
              )}
              {tab === "appointments" && (
                <Appointments appointments={appointments} />
              )}
              {tab === "settings" && <Profile doctorData={doctorData} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
