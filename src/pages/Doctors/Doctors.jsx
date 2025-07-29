import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../../firebase/config";
import Loader from "../../Components/Loader/Loading";
import Error from "../../Components/Error/Error";
import Testimonial from "../../Components/Testimonial/Testimonial";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

const Doctors = () => {
  const [query, setQuery] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState(null);
  const [reviewsError, setReviewsError] = useState(null);
  const navigate = useNavigate();

  // جلب بيانات الأطباء من Firebase
  useEffect(() => {
    setDoctorsLoading(true);
    const doctorsRef = ref(db, "doctors");
    onValue(
      doctorsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const doctorsArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setDoctors(doctorsArray);
        } else {
          setDoctors([]);
        }
        setDoctorsLoading(false);
      },
      (err) => {
        setDoctorsError(err.message);
        setDoctorsLoading(false);
        console.error("Error fetching doctors:", err);
      }
    );
  }, []);

  // جلب بيانات التقييمات من Firebase
  useEffect(() => {
    setReviewsLoading(true);
    const reviewsRef = ref(db, "reviews");
    onValue(
      reviewsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const reviewsArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setReviews(reviewsArray);
        } else {
          setReviews([]);
        }
        setReviewsLoading(false);
      },
      (err) => {
        setReviewsError(err.message);
        setReviewsLoading(false);
        console.error("Error fetching reviews:", err);
      }
    );
  }, []);

  const calculateAvgRating = (doctorId, reviews) => {
    const doctorReviews = reviews.filter(
      (review) => review.doctorId === doctorId
    );
    if (doctorReviews.length === 0) return null;
    const totalRating = doctorReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    return totalRating / doctorReviews.length;
  };

  const renderStars = (rating) => {
    const stars = [];
    const maxStars = 5;
    // تحويل التقييم من نطاق 0-10 إلى 0-5 لعرض النجوم
    const normalizedRating = rating && !isNaN(rating) ? rating / 2 : 0;
    const fullStars = Math.floor(normalizedRating);
    const hasHalfStar = normalizedRating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar
          key={`full-${i}`}
          className="w-4 h-4 text-yellow-400"
          title="Full star"
        />
      );
    }

    if (hasHalfStar && fullStars < maxStars) {
      stars.push(
        <FaStarHalfAlt
          key="half"
          className="w-4 h-4 text-yellow-400"
          title="Half star"
        />
      );
    }

    for (let i = stars.length; i < maxStars; i++) {
      stars.push(
        <FaRegStar
          key={`empty-${i}`}
          className="w-4 h-4 text-yellow-400"
          title="Empty star"
        />
      );
    }

    return stars;
  };

  useEffect(() => {
    if (doctors && doctors.length > 0 && reviews) {
      const trimmedQuery = query.trim().toLowerCase();
      const userId = localStorage.getItem("userId");
      const role = localStorage.getItem("role");

      let enhancedDoctors = doctors.map((doctor) => {
        const avgRating = calculateAvgRating(doctor.id, reviews);
        const totalRating = reviews.filter(
          (review) => review.doctorId === doctor.id
        ).length;
        return {
          ...doctor,
          avgRating: avgRating !== null ? avgRating : doctor.avgRating || 0,
          totalRating: totalRating || doctor.totalRating || 0,
        };
      });

      if (role === "doctor" && userId) {
        enhancedDoctors = enhancedDoctors.filter(
          (doctor) => doctor.id !== userId
        );
      }

      let filtered;
      if (trimmedQuery) {
        filtered = enhancedDoctors.filter((doctor) =>
          doctor.specialization.toLowerCase().includes(trimmedQuery)
        );
      } else {
        filtered = enhancedDoctors.filter(
          (doctor) => doctor.avgRating && doctor.avgRating >= 3.5
        );
      }

      filtered.sort((a, b) => {
        const ratingA = a.avgRating || 0;
        const ratingB = b.avgRating || 0;
        return ratingB - ratingA;
      });

      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors([]);
    }
  }, [query, doctors, reviews]);

  const handleBooking = (doctorId) => {
    try {
      const role = localStorage.getItem("role");

      if (!role) {
        toast.error("No user role found. Please sign in as a patient.");
        return;
      }

      if (role !== "patient") {
        toast.error(
          "Sorry, access denied. Booking is available only for patients 😔."
        );
        toast.warn("Please sign up as a patient.");
        return;
      }

      navigate(`/doctors/${doctorId}`);
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error(
        "An error occurred while trying to navigate to the booking page."
      );
    }
  };

  return (
    <>
      <section className="bg-[#fff9ea]">
        <div className="text-center container">
          <h2 className="heading">Find A Doctor</h2>
          <div className="max-w-[570px] mt-[30px] mx-auto bg-[#0066ff2c] rounded-md flex items-center justify-between">
            <input
              type="search"
              placeholder="Search by specialization (e.g., Surgeon, Neurologist)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="py-4 pl-4 pr-2 bg-transparent w-full cursor-pointer focus:outline-none placeholder:text-textColor"
            />
            <button
              className="bg-primaryColor text-white font-[600] h-[44px] px-6 rounded-[50px]"
              onClick={() => setQuery(query.trim())}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          {(doctorsLoading || reviewsLoading) && <Loader />}
          {(doctorsError || reviewsError) && (
            <Error errMessage={doctorsError || reviewsError} />
          )}
          {!doctorsLoading &&
            !reviewsLoading &&
            !doctorsError &&
            !reviewsError && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 lg:gap-[30px] justify-items-center">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="card bg-base-100 w-96 shadow-sm"
                    >
                      <figure className="px-10 pt-10">
                        <img
                          src={
                            doctor.photo ||
                            "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"
                          }
                          alt={doctor.name}
                          className="rounded-xl w-full h-[40vh] object-cover"
                        />
                      </figure>
                      <div className="card-body items-center text-center">
                        <h2 className="card-title">{doctor.name}</h2>
                        <p>{doctor.specialization}</p>
                        <div className="flex items-center gap-1">
                          {renderStars(doctor.avgRating)}
                          <span className="text-[14px] text-textColor">
                            ({doctor.totalRating || 0})
                          </span>
                        </div>
                        <div className="card-actions">
                          <button
                            className="bg-primaryColor text-white font-[600] h-[44px] px-6 rounded-[50px]"
                            onClick={() => handleBooking(doctor.id)}
                            onTouchEnd={() => handleBooking(doctor.id)}
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-textColor">
                    {query
                      ? "No doctors found for this specialization."
                      : "No doctors found with rating 3.5 or higher."}
                  </p>
                )}
              </div>
            )}
        </div>
      </section>

      <section>
        <div className="container">
          <div className="container mx-auto px-4 flex justify-center items-center">
            <div className="xl:w-[470px] w-full">
              <h2 className="heading text-center">What our patients say</h2>
              <p className="text__para text-center mt-4">
                World-class care for everyone. Our health system offers
                unmatched, expert health care.
              </p>
            </div>
          </div>
          <Testimonial />
        </div>
      </section>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default Doctors;
