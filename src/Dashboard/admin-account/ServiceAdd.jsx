import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL, token } from "../../config";
import uploadImageToCloudinary from "../../utils/uploadCloudinary";

const ServiceAdd = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", desc: "", image: "" });
  const [newImage, setNewImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      if (!imageUrl) {
        throw new Error("Cloudinary returned no image URL");
      }
      setNewImage(imageUrl);
      setFormData((prev) => {
        return { ...prev, image: imageUrl };
      });
    } catch (error) {
      console.error("Image upload error:", error);
      Swal.fire({
        title: "Error!",
        text: `Failed to upload image to Cloudinary: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (uploading) {
      Swal.fire({
        title: "Error!",
        text: "Image is still uploading. Please wait.",
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
      return;
    }

    if (!formData.name.trim() || !formData.desc.trim() || !formData.image) {
      Swal.fire({
        title: "Error!",
        text: `Please fill in all fields. Missing: ${
          !formData.name.trim() ? "Name, " : ""
        }${!formData.desc.trim() ? "Description, " : ""}${
          !formData.image ? "Image" : ""
        }`,
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
      return;
    }

    if (!token) {
      Swal.fire({
        title: "Error!",
        text: "Please log in to add services.",
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      }).then(() => navigate("/login"));
      return;
    }

    const internalId = `srv${Date.now()}`;
    const serviceData = {
      ...formData,
      id: internalId,
      bgColor: "rgba(75, 192, 192, .2)",
      textColor: "#4BC0C0",
    };

    try {
      const response = await axios.post(
        `${BASE_URL}/services.json?auth=${token}`,
        serviceData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status >= 300 && response.status < 400) {
        console.warn("Redirect detected in POST request:", response.status);
        throw new Error("Unexpected redirect from server");
      }

      Swal.fire({
        title: "Saved!",
        text: "Service added successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/services");
    } catch (error) {
      console.error("Create error:", error);
      Swal.fire({
        title: "Error!",
        text: `Failed to add service: ${error.message}`,
        icon: "error",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
    }
  };

  if (!token) {
    Swal.fire({
      title: "Error!",
      text: "Please log in to add services.",
      icon: "error",
      confirmButtonColor: "#3085d6",
      confirmButtonText: "OK",
    }).then(() => navigate("/login"));
    return null;
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full mb-[8em]"
      >
        <h1 className="text-2xl font-bold mb-4 text-blue-400">
          Add New Service
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
              src={newImage || "https://webemps.com/images/default-image.jpg"}
              alt="Preview"
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
                disabled={uploading}
              />
              <label
                htmlFor="customFile"
                className={`absolute top-0 left-0 w-full h-full flex items-center px-[0.75rem] py-[0.375rem] text-[15px] leading-6 overflow-hidden text-headingColor bg-[#0066ff46] font-semibold rounded-lg truncate cursor-pointer ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={uploading}
            className={`text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded hover:cursor-pointer ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => navigate("/all-services")}
            className="text-white bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded hover:cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceAdd;
