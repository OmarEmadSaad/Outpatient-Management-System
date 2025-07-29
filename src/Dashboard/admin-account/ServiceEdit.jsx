import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { service_URL, BASE_URL } from "../../config";
import uploadImageToCloudinary from "../../utils/uploadCloudinary";
import Loading from "../../Components/Loader/Loading";

const ServiceEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    desc: "",
    image: "",
    id: "",
  });
  const [originalData, setOriginalData] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseKey, setFirebaseKey] = useState(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await axios.get(service_URL);

        if (response.status >= 300 && response.status < 400) {
          console.warn("Redirect detected in GET /services:", response.status);
          throw new Error("Unexpected redirect from server");
        }

        const services = response.data;
        if (!services) {
          throw new Error("No services found");
        }

        const serviceKey = Object.keys(services).find(
          (key) => services[key].id === id
        );

        if (!serviceKey) {
          throw new Error("Service not found");
        }

        const serviceData = services[serviceKey];
        setFirebaseKey(serviceKey);
        setFormData({
          name: serviceData.name || "",
          desc: serviceData.desc || "",
          image: serviceData.image || "",
          id: serviceData.id || id,
        });
        setOriginalData({
          name: serviceData.name || "",
          desc: serviceData.desc || "",
          image: serviceData.image || "",
          id: serviceData.id || id,
        });
      } catch (error) {
        console.error("Error fetching service:", error);
        Swal.fire({
          title: "Error!",
          text: `Failed to fetch service: ${error.message || "Unknown error"}`,
          icon: "error",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        });
        navigate("/all-services");
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const imageUrl = await uploadImageToCloudinary(file);
        setNewImage(imageUrl);
        setFormData((prev) => ({ ...prev, image: imageUrl }));
      } catch (error) {
        console.error("Image upload error:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to upload image to Cloudinary.",
          icon: "error",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firebaseKey) {
      Swal.fire({
        title: "Error!",
        text: "Service key not found.",
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
      return;
    }

    const updatedFields = {};
    if (formData.name !== originalData?.name)
      updatedFields.name = formData.name;
    if (formData.desc !== originalData?.desc)
      updatedFields.desc = formData.desc;
    if (newImage || formData.image !== originalData?.image)
      updatedFields.image = formData.image;
    if (formData.id) updatedFields.id = formData.id;

    if (!Object.keys(updatedFields).length) {
      Swal.fire({
        title: "No changes!",
        text: "No updates to save.",
        icon: "info",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const response = await axios.patch(
        `${BASE_URL}/services/${firebaseKey}.json`,
        updatedFields
      );

      if (response.status >= 300 && response.status < 400) {
        console.warn("Redirect detected in PATCH request:", response.status);
        throw new Error("Unexpected redirect from server");
      }

      Swal.fire({
        title: "Saved!",
        text: "Service updated successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/services");
    } catch (error) {
      console.error("Update error:", error);
      Swal.fire({
        title: "Error!",
        text: `Failed to update service: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
    }
  };

  return loading ? (
    <div className="flex justify-center items-center h-screen">
      <Loading />
    </div>
  ) : !formData.name ? (
    <div className="p-6 text-center text-red-500">Service not found.</div>
  ) : (
    <div className="flex justify-center items-center min-h-screen p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full mb-[8em]"
      >
        <h1 className="text-2xl font-bold mb-4 text-blue-400">
          Edit Service: {formData.name}
        </h1>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2 text-right">
            Service Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
            placeholder="Enter service name"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2 text-right">
            Description
          </label>
          <textarea
            name="desc"
            value={formData.desc}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-right"
            placeholder="Enter service description"
            rows="4"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2 text-right">
            Image
          </label>
          <div className="flex items-center space-x-4">
            <img
              src={newImage || formData.image}
              alt="Image preview"
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="relative h-[50px] w-[130px]">
              <input
                type="file"
                name="image"
                id="customFile"
                onChange={handleImageChange}
                accept=".jpg, .png"
                className="hidden"
              />
              <label
                htmlFor="customFile"
                className="absolute top-0 left-0 w-full h-full flex items-center px-[0.75rem] py-[0.375rem] text-[15px] leading-6 overflow-hidden text-headingColor bg-[#0066ff46] font-semibold rounded-lg truncate cursor-pointer"
              >
                Upload Photo
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded hover:cursor-pointer"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-white bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded hover:cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceEdit;
