import SignupImg from "../assets/images/signup.gif";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import uploadImageToCloudinary from "../utils/uploadCloudinary";
import { BASE_URL, token } from "../config";
import { toast } from "react-toastify";
import HashLoader from "react-spinners/HashLoader";

const DEFAULT_PHOTO_URL =
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4Avj4TSMtuTPrA1IqGtlWogrd6D3aZhVwCA98c3NC442QLQU0rmqWv7M&s";

const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 4);
};

const Signup = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    photo: DEFAULT_PHOTO_URL,
    gender: "",
    role: "",
    specialization: "",
    phone: "",
    qualifications: [],
    ticketPrice: 0,
    timeSlots: [],
    experiences: [],
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    gender: "",
    role: "",
    photo: "",
    specialization: "",
    phone: "",
    qualifications: "",
    ticketPrice: "",
    timeSlots: "",
    experiences: "",
  });
  const [emailExists, setEmailExists] = useState(false);

  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("role") === "admin";

  const validate = () => {
    let isValid = true;
    let newErrors = { ...errors };

    Object.keys(newErrors).forEach((key) => (newErrors[key] = ""));

    if (!/^[a-zA-Z0-9\s]{3,15}$/.test(formData.name.trim())) {
      newErrors.name =
        "Name must be 3-15 characters long and contain only letters, numbers, or spaces.";
      isValid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password.trim())
    ) {
      newErrors.password =
        "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, and a number.";
      isValid = false;
    }

    if (!formData.gender) {
      newErrors.gender = "Please select your gender.";
      isValid = false;
    }

    if (!formData.role) {
      newErrors.role = "Please select a role.";
      isValid = false;
    }
    if (formData.role === "doctor") {
      if (formData.phone.trim() && !/^\d{10,15}$/.test(formData.phone.trim())) {
        newErrors.phone = "Phone number must be 10-15 digits.";
        isValid = false;
      }
      if (formData.ticketPrice && isNaN(Number(formData.ticketPrice))) {
        newErrors.ticketPrice = "Ticket price must be a number.";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const checkEmailExists = async (email) => {
    try {
      let urlToUse;
      if (formData.role === "patient") {
        urlToUse = `${BASE_URL}/users.json`;
      } else if (formData.role === "doctor") {
        urlToUse = `${BASE_URL}/doctors.json`;
      } else if (formData.role === "admin") {
        urlToUse = `${BASE_URL}/admins.json`;
      } else {
        return false;
      }

      console.log(`Signup.jsx: Checking email existence at: ${urlToUse}`);
      const res = await fetch(urlToUse, {});

      if (!res.ok) {
        const errorData = await res.json();

        throw new Error(
          `Failed to fetch ${formData.role} data for email check: ${
            res.statusText || errorData.error
          }`
        );
      }
      const data = await res.json();
      const foundUser = Object.values(data || {}).find(
        (u) => u.email && u.email.toLowerCase() === email.toLowerCase()
      );
      setEmailExists(!!foundUser);
      return !!foundUser;
    } catch (error) {
      console.error("Signup.jsx: Error checking email:", error);
      toast.error("Error checking email availability. Please try again.");
      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "email" && value.trim()) {
      setEmailExists(false);
      checkEmailExists(value);
    }
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setFormData({ ...formData, photo: DEFAULT_PHOTO_URL });
      setPreviewURL(DEFAULT_PHOTO_URL);
      setSelectedFile(null);
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Please upload a JPG or PNG image");
      return;
    }

    setLoading(true);
    try {
      console.log("Signup.jsx: Uploading image to Cloudinary...");
      const imageUrl = await uploadImageToCloudinary(file);
      if (!imageUrl) {
        throw new Error("Cloudinary returned no image URL");
      }
      console.log("Signup.jsx: Image uploaded:", imageUrl);
      setPreviewURL(imageUrl);
      setSelectedFile(imageUrl);
      setFormData({ ...formData, photo: imageUrl });
      setErrors({ ...errors, photo: "" });
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error("Signup.jsx: Error uploading image:", error);
      toast.error("Failed to upload image. Please try again.");
      setFormData({ ...formData, photo: DEFAULT_PHOTO_URL });
      setPreviewURL(DEFAULT_PHOTO_URL);
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!validate()) {
      setLoading(false);
      toast.error("Please fix the errors in the form.");
      return;
    }

    const isEmailTaken = await checkEmailExists(formData.email.trim());
    if (isEmailTaken) {
      setErrors((prev) => ({
        ...prev,
        email: "This email is already registered.",
      }));
      setEmailExists(true);
      setLoading(false);
      toast.error("Email is already registered. Please use a different email.");
      return;
    }

    try {
      let urlToUse;
      let dataToSend = {
        id: generateUniqueId(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        photo: formData.photo || DEFAULT_PHOTO_URL,
        gender: formData.gender,
        role: formData.role,
      };

      if (formData.role === "patient") {
        urlToUse = `${BASE_URL}/users.json`;
      } else if (formData.role === "doctor") {
        urlToUse = `${BASE_URL}/doctors.json`;
        dataToSend.phone = formData.phone.trim();
        dataToSend.specialization = formData.specialization.trim();

        dataToSend.qualifications = [];
        dataToSend.experiences = [];
        dataToSend.timeSlots = [];
        dataToSend.ticketPrice = Number(formData.ticketPrice) || 0;
      } else if (formData.role === "admin") {
        urlToUse = `${BASE_URL}/admins.json`;
      } else {
        throw new Error("Invalid role selected. Please choose a valid role.");
      }

      console.log(`Signup.jsx: Registering ${formData.role} at: ${urlToUse}`);
      console.log("Signup.jsx: Data to send:", dataToSend);

      const res = await fetch(urlToUse, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Signup.jsx: API response not OK:", data);
        throw new Error(
          data.error?.message || `Failed to register ${formData.role}.`
        );
      }

      const userIdFromFirebase = data.name;

      localStorage.setItem("userId", userIdFromFirebase);
      localStorage.setItem("role", formData.role);
      setLoading(false);
      toast.success(
        `${
          formData.role.charAt(0).toUpperCase() + formData.role.slice(1)
        } registered successfully!`,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      navigate("/login");
    } catch (error) {
      console.error("Signup.jsx: Signup error:", error);
      let errorMessage = "Something went wrong. Please try again.";
      if (error.message.includes("email")) {
        errorMessage = "This email is already registered.";
        setErrors((prev) => ({ ...prev, email: errorMessage }));
        setEmailExists(true);
      }
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setLoading(false);
    }
  };

  return (
    <section className="px-5 xl:px-0">
      <div className="mx-auto max-w-[1170px]">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="hidden lg:block bg-primaryColor rounded-l-lg">
            <figure className="rounded-l-lg">
              <img
                src={SignupImg}
                className="w-full rounded-l-lg"
                alt="Signup"
              />
            </figure>
          </div>

          <div className="rounded-l-lg lg:pl-16 py-10">
            <h3 className="text-headingColor text-[22px] leading-9 mb-10">
              Create an <span className="text-primaryColor">account</span>
            </h3>

            <form onSubmit={submitHandler}>
              <div className="mb-5">
                <input
                  name="name"
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-b border-solid border-[#0066ff61] focus:outline-none text-[16px] leading-7 focus:border-b-primaryColor text-headingColor placeholder:text-textColor rounded-md"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div className="mb-5 mt-4">
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-b border-solid border-[#0066ff61] focus:outline-none text-[16px] leading-7 focus:border-b-primaryColor text-headingColor placeholder:text-textColor rounded-md"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
                {emailExists && (
                  <p className="text-red-500 text-sm mt-1">
                    This email is already registered.
                  </p>
                )}
              </div>

              <div className="mb-5 mt-4">
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-b border-solid border-[#0066ff61] focus:outline-none text-[16px] leading-7 focus:border-b-primaryColor text-headingColor placeholder:text-textColor rounded-md"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div className="mb-5 flex justify-between">
                <label className="text-headingColor font-bold text-[16px] leading-7">
                  Are you a:
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="text-headingColor text-[15px] font-semibold leading-7 px-4 py-3 focus:outline-none"
                  >
                    <option value="">Select Role</option>
                    {!isAdmin && <option value="patient">Patient</option>}
                    {isAdmin && <option value="doctor">Doctor</option>}
                    {isAdmin && <option value="admin">Admin</option>}
                  </select>
                </label>
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                )}

                <label className="text-headingColor font-bold text-[16px] leading-7">
                  Gender:
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="text-headingColor text-[15px] font-semibold leading-7 px-4 py-3 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>
                {errors.gender && (
                  <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                )}
              </div>

              {formData.role === "doctor" && (
                <>
                  <div className="mb-5">
                    <input
                      name="phone"
                      type="text"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-b border-solid border-[#0066ff61] focus:outline-none text-[16px] leading-7 focus:border-b-primaryColor text-headingColor placeholder:text-textColor rounded-md"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="mb-5">
                    <input
                      name="specialization"
                      type="text"
                      placeholder="Enter your specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-b border-solid border-[#0066ff61] focus:outline-none text-[16px] leading-7 focus:border-b-primaryColor text-headingColor placeholder:text-textColor rounded-md"
                    />
                    {errors.specialization && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.specialization}
                      </p>
                    )}
                  </div>

                  <div className="mb-5">
                    <input
                      name="ticketPrice"
                      type="number"
                      placeholder="Enter ticket price"
                      value={formData.ticketPrice}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-b border-solid border-[#0066ff61] focus:outline-none text-[16px] leading-7 focus:border-b-primaryColor text-headingColor placeholder:text-textColor rounded-md"
                    />
                    {errors.ticketPrice && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.ticketPrice}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="mb-5 gap-3 flex items-center">
                {previewURL && (
                  <figure className="w-[60px] h-[60px] rounded-full border-2 border-primaryColor flex items-center justify-center">
                    <img
                      src={previewURL}
                      className="rounded-full w-full"
                      alt="Avatar"
                    />
                  </figure>
                )}

                <div className="relative h-[50px] w-[130px]">
                  <input
                    type="file"
                    name="photo"
                    id="customFile"
                    onChange={handleFileInputChange}
                    accept=".jpg, .png, image/jpeg, image/png"
                    className="hidden"
                    disabled={loading}
                  />
                  <label
                    htmlFor="customFile"
                    className={`absolute top-0 left-0 w-full h-full flex items-center px-[0.75rem] py-[0.375rem] text-[15px] leading-6 overflow-hidden text-headingColor bg-[#0066ff46] font-semibold rounded-lg truncate cursor-pointer ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? "Uploading..." : "Upload Photo"}
                  </label>
                </div>
              </div>

              <div className="mt-7">
                <button
                  disabled={loading}
                  className="w-full btn btn-accent text-white bg-blue-600"
                  type="submit"
                >
                  {loading ? (
                    <HashLoader size={35} color="#ffffff" />
                  ) : (
                    "Register"
                  )}
                </button>
              </div>

              <p className="mt-3">
                Already have an account?
                <Link
                  to="/login"
                  className="text-primaryColor font-medium ml-1"
                >
                  Login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
