import type {
  CloudinaryUploadResult,
  UploadPurpose,
  UploadSignatureResponse,
} from "@/types/api";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const unsignedPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const ACCEPTED_IMAGE_TYPES: readonly string[] = ["image/jpeg", "image/png"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const requestSignature = async (
  purpose: UploadPurpose
): Promise<UploadSignatureResponse> => {
  const response = await fetch("/api/uploads/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ purpose }),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (data as { error?: unknown }).error;
    throw new Error(typeof message === "string" ? message : "Upload is not allowed");
  }
  return data as UploadSignatureResponse;
};

const buildUploadForm = (
  file: File,
  signature: UploadSignatureResponse,
  preset: string
): FormData => {
  const form = new FormData();
  form.append("file", file);
  if (signature.signed) {
    form.append("api_key", signature.apiKey);
    form.append("timestamp", String(signature.timestamp));
    form.append("folder", signature.folder);
    form.append("allowed_formats", signature.allowed_formats);
    form.append("public_id", signature.public_id);
    form.append("transformation", signature.transformation);
    form.append("signature", signature.signature);
  } else {
    form.append("upload_preset", preset);
  }
  return form;
};

const uploadImageToCloudinary = async (
  file: File,
  purpose: UploadPurpose = "avatar"
): Promise<string> => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Please upload a JPG or PNG image");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 5 MB or smaller");
  }

  const signature = await requestSignature(purpose);
  const targetCloud = signature.signed ? signature.cloudName : cloudName;
  if (!targetCloud || (!signature.signed && !unsignedPreset)) {
    throw new Error("Image uploads are not configured");
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${targetCloud}/image/upload`,
      {
        method: "POST",
        body: buildUploadForm(file, signature, unsignedPreset ?? ""),
      }
    );
    const result = (await response.json()) as CloudinaryUploadResult;
    if (!result.secure_url) {
      throw new Error("Failed to upload image. No secure URL found.");
    }
    return result.secure_url;
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error("Failed to upload image");
  }
};

export default uploadImageToCloudinary;
