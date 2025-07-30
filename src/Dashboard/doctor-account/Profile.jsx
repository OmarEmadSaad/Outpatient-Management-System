import { useEffect, useState, useContext } from "react";
import {
  AiOutlineDelete,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import uploadImageToCloudinary from "../../utils/uploadCloudinary";
import { toast } from "react-toastify";
import { authContext } from "../../context/AuthContext";
import HashLoader from "react-spinners/HashLoader";
import { doctor_URL, service_URL } from "../../config";
const Profile = () => {
  const { user, userId, role } = useContext(authContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bio: "",
    gender: "",
    specialization: "",
    ticketPrice: 0,
    photo: null,
    about: "",
    qualifications: [
      { startingDate: "", endingDate: "", degree: "", university: "" },
    ],
    experiences: [
      { startingDate: "", endingDate: "", position: "", hospital: "" },
    ],
    timeSlots: [{ day: "", startingTime: "", endingTime: "" }],
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const firebaseIdToken = user?.token;

        const authParam = firebaseIdToken ? `?auth=${firebaseIdToken}` : "";

        const res = await fetch(`${service_URL}${authParam}`);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch services");
        }
        const servicesData = await res.json();
        const servicesArray = servicesData ? Object.values(servicesData) : [];
        setServices(servicesArray);
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error("Failed to load services: " + error.message);
      }
    };

    if (user) {
      fetchServices();
    }
  }, [user]);
  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!userId || !role || role !== "doctor") {
        console.warn("Missing userId or invalid role:", { userId, role });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const firebaseIdToken = user?.token;
        const authParam = firebaseIdToken ? `?auth=${firebaseIdToken}` : "";

        // Query the doctor directly using the Firebase key (userId)
        const res = await fetch(
          `${doctor_URL.replace(".json", "")}/${userId}.json${authParam}`
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch doctor data");
        }

        const doctor = await res.json();

        if (!doctor) {
          throw new Error("Doctor not found for the current user.");
        }

        setFormData({
          name: doctor.name || "",
          email: doctor.email || "",
          password: "",
          phone: doctor.phone || "",
          bio: doctor.bio || "",
          gender: doctor.gender || "",
          specialization: doctor.specialization || "",
          ticketPrice: doctor.ticketPrice || 0,
          qualifications: doctor.qualifications?.length
            ? doctor.qualifications
            : [
                {
                  startingDate: "",
                  endingDate: "",
                  degree: "",
                  university: "",
                },
              ],
          experiences: doctor.experiences?.length
            ? doctor.experiences
            : [
                {
                  startingDate: "",
                  endingDate: "",
                  position: "",
                  hospital: "",
                },
              ],
          timeSlots: doctor.timeSlots?.length
            ? doctor.timeSlots
            : [{ day: "", startingTime: "", endingTime: "" }],
          photo: doctor.photo || null,
          about: doctor.about || "",
        });
        setPreviewURL(doctor.photo || "");
      } catch (error) {
        console.error("Error fetching doctor data:", error);
        toast.error("Failed to load doctor data: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && userId && role === "doctor") {
      fetchDoctorData();
    } else if (!user) {
      setIsLoading(false);
    }
  }, [userId, role, user]);
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Please upload a JPG or PNG image");
      return;
    }

    const preview = URL.createObjectURL(file);
    setPreviewURL(preview);
    setSelectedFile(file);

    try {
      setLoading(true);
      const imageUrl = await uploadImageToCloudinary(file);
      setFormData({ ...formData, photo: imageUrl });
      toast.success("Photo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload photo: " + error.message);
      setPreviewURL(formData.photo || "");
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name.trim()) {
      toast.error("Full name is required");
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      setLoading(false);
      return;
    }
    if (!formData.gender) {
      toast.error("Please select your gender");
      setLoading(false);
      return;
    }
    if (!formData.specialization.trim()) {
      toast.error("Specialization is required");
      setLoading(false);
      return;
    }

    try {
      const firebaseIdToken = user?.token;
      const authParam = firebaseIdToken ? `?auth=${firebaseIdToken}` : "";

      const updatedData = {
        name: formData.name,
        email: formData.email,
        ...(formData.password && { password: formData.password }),
        phone: formData.phone,
        bio: formData.bio,
        gender: formData.gender,
        specialization: formData.specialization,
        ticketPrice: formData.ticketPrice,
        photo: formData.photo,
        about: formData.about,
        qualifications: formData.qualifications,
        experiences: formData.experiences,
        timeSlots: formData.timeSlots,
      };

      const res = await fetch(
        `${doctor_URL.replace(".json", "")}/${userId}.json${authParam}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const addItem = (key, item) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [key]: [...prevFormData[key], item],
    }));
  };

  const deleteQualification = (index) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      qualifications: prevFormData.qualifications.filter((_, i) => i !== index),
    }));
  };

  const addQualification = (e) => {
    e.preventDefault();
    addItem("qualifications", {
      startingDate: "",
      endingDate: "",
      degree: "",
      university: "",
    });
  };

  const handleQualificationChange = (event, index) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => {
      const updatedQualifications = [...prevFormData.qualifications];
      updatedQualifications[index] = {
        ...updatedQualifications[index],
        [name]: value,
      };
      return { ...prevFormData, qualifications: updatedQualifications };
    });
  };

  const addExperience = (e) => {
    e.preventDefault();
    addItem("experiences", {
      startingDate: "",
      endingDate: "",
      position: "",
      hospital: "",
    });
  };

  const handleExperienceChange = (event, index) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => {
      const updatedExperiences = [...prevFormData.experiences];
      updatedExperiences[index] = {
        ...updatedExperiences[index],
        [name]: value,
      };
      return { ...prevFormData, experiences: updatedExperiences };
    });
  };

  const deleteExperience = (index) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      experiences: prevFormData.experiences.filter((_, i) => i !== index),
    }));
  };

  const addTimeSlot = (e) => {
    e.preventDefault();
    addItem("timeSlots", { day: "", startingTime: "", endingTime: "" });
  };

  const handleTimeSlotChange = (event, index) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => {
      const updatedTimeSlots = [...prevFormData.timeSlots];
      updatedTimeSlots[index] = { ...updatedTimeSlots[index], [name]: value };
      return { ...prevFormData, timeSlots: updatedTimeSlots };
    });
  };

  const deleteTimeSlot = (index) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      timeSlots: prevFormData.timeSlots.filter((_, i) => i !== index),
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!user || !userId || role !== "doctor") {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-lg text-red-500">
        Please log in as a doctor to view and edit your profile.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-[50vh]">
        <HashLoader size={50} color="#0066ff" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h2 className="text-headingColor mb-6 leading-9 font-bold text-[18px] sm:text-[24px]">
        Profile Information for <span className="text-blue-500">{role}</span>
      </h2>

      <form onSubmit={updateProfileHandler}>
        <div className="mb-5">
          <p className="form__label">Name*</p>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Full Name"
            className="form__input w-full sm:w-1/2 max-w-md"
            required
          />
        </div>

        <div className="mb-5 hover:cursor-no-drop">
          <p className="form__label">Email*</p>
          <input
            type="email"
            name="email"
            value={formData.email}
            placeholder="Your Email"
            className="form__input w-full sm:w-1/2 max-w-md hover:cursor-no-drop"
            readOnly
            disabled
          />
        </div>

        <div className="mb-5 relative">
          <p className="form__label">Password</p>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Update Password"
            className="form__input w-full sm:w-1/2 max-w-md pr-10"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-[3.9em] sm:left-[23em] sm:top-[3.5em] lg:right-[14.3em] lg:top-[3.8em] transform -translate-y-1/2 text-base sm:text-lg text-headingColor"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
          </button>
        </div>

        <div className="mb-5">
          <p className="form__label">Phone</p>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Your Phone"
            className="form__input w-full sm:w-1/2 max-w-md"
          />
        </div>

        <div className="mb-5">
          <p className="form__label">Bio</p>
          <input
            type="text"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Bio"
            className="form__input w-full sm:w-1/2 max-w-md"
            maxLength={100}
          />
        </div>

        <div className="mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="form__label">Gender*</p>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="form__input py-2.5 w-full"
                required
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <p className="form__label">Specialization*</p>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                className="form__input py-2.5 w-full"
                required
              >
                <option value="">Select</option>
                {services.map((service) => (
                  <option key={service.id} value={service.name}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="form__label">Ticket Price</p>
              <input
                type="number"
                placeholder="100"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleInputChange}
                className="form__input py-2.5 w-full"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="mb-5">
          <p className="form__label">Qualifications*</p>
          {formData.qualifications?.map((item, index) => (
            <div key={index} className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="form__label">Starting Date*</p>
                  <input
                    type="date"
                    name="startingDate"
                    value={item.startingDate || ""}
                    onChange={(e) => handleQualificationChange(e, index)}
                    className="form__input w-full"
                    required
                  />
                </div>
                <div>
                  <p className="form__label">Ending Date*</p>
                  <input
                    type="date"
                    name="endingDate"
                    value={item.endingDate || ""}
                    onChange={(e) => handleQualificationChange(e, index)}
                    className="form__input w-full"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="form__label">Degree*</p>
                  <input
                    type="text"
                    name="degree"
                    value={item.degree || ""}
                    onChange={(e) => handleQualificationChange(e, index)}
                    className="form__input w-full"
                    required
                  />
                </div>
                <div>
                  <p className="form__label">University*</p>
                  <input
                    type="text"
                    name="university"
                    value={item.university || ""}
                    onChange={(e) => handleQualificationChange(e, index)}
                    className="form__input w-full"
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                className="bg-red-600 p-2 rounded-full text-white text-[18px] mt-4 hover:bg-red-700 transition"
                onClick={() => deleteQualification(index)}
                aria-label="Delete qualification"
              >
                <AiOutlineDelete />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addQualification}
            className="bg-black py-2 px-4 rounded text-white text-sm hover:bg-gray-800 transition"
          >
            Add Qualification
          </button>
        </div>

        <div className="mb-5">
          <p className="form__label">Experiences*</p>
          {formData.experiences?.map((item, index) => (
            <div key={index} className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="form__label">Starting Date*</p>
                  <input
                    type="date"
                    name="startingDate"
                    value={item.startingDate || ""}
                    onChange={(e) => handleExperienceChange(e, index)}
                    className="form__input w-full"
                    required
                  />
                </div>
                <div>
                  <p className="form__label">Ending Date*</p>
                  <input
                    type="date"
                    name="endingDate"
                    value={item.endingDate || ""}
                    onChange={(e) => handleExperienceChange(e, index)}
                    className="form__input w-full"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="form__label">Position*</p>
                  <input
                    type="text"
                    name="position"
                    value={item.position || ""}
                    onChange={(e) => handleExperienceChange(e, index)}
                    className="form__input w-full"
                    required
                  />
                </div>
                <div>
                  <p className="form__label">Hospital*</p>
                  <input
                    type="text"
                    name="hospital"
                    value={item.hospital || ""}
                    onChange={(e) => handleExperienceChange(e, index)}
                    className="form__input w-full"
                    required
                  />
                </div>
              </div>
              <button
                type="button"
                className="bg-red-600 p-2 rounded-full text-white text-[18px] mt-4 hover:bg-red-700 transition"
                onClick={() => deleteExperience(index)}
                aria-label="Delete experience"
              >
                <AiOutlineDelete />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addExperience}
            className="bg-black py-2 px-4 rounded text-white text-sm hover:bg-gray-800 transition"
          >
            Add Experience
          </button>
        </div>

        <div className="mb-5">
          <p className="form__label mb-4">Time Slots*</p>
          {formData.timeSlots?.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-4"
            >
              <select
                name="day"
                value={item.day || ""}
                onChange={(e) => handleTimeSlotChange(e, index)}
                className="form__input py-2.5 w-full sm:w-1/3"
                required
              >
                <option value="">Select</option>
                <option value="Sat">Sat</option>
                <option value="Sun">Sun</option>
                <option value="Mon">Mon</option>
                <option value="Tue">Tue</option>
                <option value="Wed">Wed</option>
                <option value="Thu">Thu</option>
                <option value="Fri">Fri</option>
              </select>
              <input
                type="time"
                name="startingTime"
                value={item.startingTime || ""}
                onChange={(e) => handleTimeSlotChange(e, index)}
                className="form__input py-2.5 w-full sm:w-1/3"
                required
              />
              <input
                type="time"
                name="endingTime"
                value={item.endingTime || ""}
                onChange={(e) => handleTimeSlotChange(e, index)}
                className="form__input py-2.5 w-full sm:w-1/3"
                required
              />
              <button
                type="button"
                onClick={() => deleteTimeSlot(index)}
                className="bg-red-600 p-2 rounded-full text-white text-[18px] hover:bg-red-700 transition"
                aria-label="Delete time slot"
              >
                <AiOutlineDelete />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTimeSlot}
            className="bg-black py-2 px-4 rounded text-white text-sm hover:bg-gray-800 transition"
          >
            Add Time Slot
          </button>
        </div>

        <div className="mb-5">
          <p className="form__label">About</p>
          <textarea
            name="about"
            rows={5}
            value={formData.about || ""}
            onChange={handleInputChange}
            placeholder="Write about you"
            className="form__input w-full sm:w-1/2 max-w-md"
          />
        </div>

        <div className="mb-5 flex items-center gap-3">
          {(selectedFile || formData.photo) && previewURL && (
            <figure className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-primaryColor flex items-center justify-center">
              <img
                src={previewURL}
                className="rounded-full w-full h-full object-cover"
                alt="Avatar"
              />
            </figure>
          )}
          <div className="relative w-full sm:w-32 h-10">
            <input
              type="file"
              name="photo"
              id="customFile"
              onChange={handleFileInputChange}
              accept=".jpg,.png"
              className="hidden"
            />
            <label
              htmlFor="customFile"
              className="absolute top-0 left-0 w-full h-full flex items-center justify-center px-2 py-1 text-sm sm:text-base text-headingColor bg-[#0066ff46] font-semibold rounded-lg cursor-pointer"
            >
              {loading ? (
                <HashLoader size={20} color="#0066ff" />
              ) : selectedFile ? (
                "Change Photo"
              ) : (
                "Upload Photo"
              )}
            </label>
          </div>
        </div>

        <div className="mt-7">
          <button
            disabled={loading}
            type="submit"
            className="bg-primaryColor cursor-pointer text-white text-sm sm:text-base px-4 py-2 rounded-lg hover:bg-primaryColor/90 transition disabled:opacity-50"
          >
            {loading ? (
              <HashLoader size={20} color="#ffffff" />
            ) : (
              "Update Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
