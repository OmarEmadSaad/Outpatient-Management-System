import DoctorCard from "./DoctorCard";
import Loader from "../../Components/Loader/Loading";
import Error from "../../Components/Error/Error";
import { doctor_URL } from "../../config";
import UseFetchData from "../../hooks/UseFetchDate";

const DoctorList = () => {
  const { data: doctors, loading, error } = UseFetchData(doctor_URL);

  return (
    <>
      {loading && <Loader />}
      {error && (
        <Error errMessage={error.message || "Something went wrong!"} />
      )}{" "}
      {!error && !loading && doctors && Array.isArray(doctors) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 lg:gap-[30px] mt-[30px] lg:mt-[55px] justify-items-center">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
      {!error && !loading && (!doctors || doctors.length === 0) && (
        <p className="text-center text-textColor mt-5">No doctors found.</p>
      )}
    </>
  );
};

export default DoctorList;
