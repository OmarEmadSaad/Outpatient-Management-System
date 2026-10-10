import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { UploadPurpose } from "@/types/api";

interface UploadPurposeConfig {
  folder: string;
  requiresAdmin: boolean;
}

export const UPLOAD_PURPOSES: Readonly<Record<UploadPurpose, UploadPurposeConfig>> =
  Object.freeze({
    avatar: { folder: "osm/avatars", requiresAdmin: false },
    service: { folder: "osm/services", requiresAdmin: true },
  });

export const isUploadPurpose = (value: unknown): value is UploadPurpose =>
  value === "avatar" || value === "service";

export const ALLOWED_UPLOAD_FORMATS = "jpg,png";
export const INCOMING_TRANSFORMATION = "c_limit,w_1600,h_1600";

interface SigningConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export const cloudinarySigningConfig = (): SigningConfig | null => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret
    ? { cloudName, apiKey, apiSecret }
    : null;
};

export type SignableParams = Record<string, string | number | undefined>;

export const signCloudinaryParams = (
  params: SignableParams,
  apiSecret: string
): string => {
  const payload = Object.keys(params)
    .filter((name) => params[name] !== undefined && params[name] !== "")
    .sort()
    .map((name) => `${name}=${params[name]}`)
    .join("&");
  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
};

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  allowed_formats: string;
  folder: string;
  public_id: string;
  transformation: string;
  timestamp: number;
  signature: string;
}

export const createUploadSignature = (
  purpose: UploadPurpose,
  now: number = Date.now()
): UploadSignature | null => {
  const config = cloudinarySigningConfig();
  if (!config) return null;
  const params = {
    allowed_formats: ALLOWED_UPLOAD_FORMATS,
    folder: UPLOAD_PURPOSES[purpose].folder,
    public_id: randomBytes(12).toString("hex"),
    transformation: INCOMING_TRANSFORMATION,
    timestamp: Math.floor(now / 1000),
  };
  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    ...params,
    signature: signCloudinaryParams(params, config.apiSecret),
  };
};
