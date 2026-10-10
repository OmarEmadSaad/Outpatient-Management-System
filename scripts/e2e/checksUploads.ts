import { createHash } from "node:crypto";
import { at } from "../json.ts";
import { emulatorEnv } from "./env.ts";
import { createClient, expectThat } from "./harness.ts";
import type { Client } from "./harness.ts";
import { legacyUsers } from "./legacySeed.ts";

const verifySignature = (data: unknown): boolean => {
  const payload = [
    "allowed_formats",
    "folder",
    "public_id",
    "timestamp",
    "transformation",
  ]
    .map((name) => `${name}=${at(data, name)}`)
    .join("&");
  return (
    createHash("sha1")
      .update(payload + emulatorEnv.CLOUDINARY_API_SECRET)
      .digest("hex") === at(data, "signature")
  );
};

export const checkUploadSigning = async (patient: Client): Promise<void> => {
  const anonymous = createClient("anonymous");
  const avatar = await anonymous.post("/api/uploads/signature", {
    purpose: "avatar",
  });
  expectThat(
    "avatar uploads are signed server-side",
    at(avatar.json, "signed") === true && verifySignature(avatar.json),
    avatar.text
  );
  expectThat(
    "upload signature never exposes the API secret",
    !avatar.text.includes(emulatorEnv.CLOUDINARY_API_SECRET)
  );
  expectThat(
    "uploads are restricted to images in a fixed folder",
    at(avatar.json, "allowed_formats") === "jpg,png" &&
      at(avatar.json, "folder") === "osm/avatars"
  );
  const second = await anonymous.post("/api/uploads/signature", {
    purpose: "avatar",
  });
  expectThat(
    "each upload signature is bound to its own random image id",
    /^[a-f0-9]{24}$/.test(String(at(avatar.json, "public_id"))) &&
      at(avatar.json, "public_id") !== at(second.json, "public_id")
  );
  expectThat(
    "uploaded images are resized to a safe maximum on arrival",
    at(avatar.json, "transformation") === "c_limit,w_1600,h_1600"
  );
  const service = await patient.post("/api/uploads/signature", {
    purpose: "service",
  });
  expectThat(
    "non-admins cannot sign service image uploads",
    service.status === 403,
    service.status
  );
  const unknown = await anonymous.post("/api/uploads/signature", {
    purpose: "anything",
  });
  expectThat("unknown upload types are rejected", unknown.status === 400);
  const crossSite = await anonymous.post(
    "/api/uploads/signature",
    { purpose: "avatar" },
    { origin: "https://evil.example" }
  );
  expectThat("cross-site upload signing is rejected", crossSite.status === 403);
  const foreignPhoto = await patient.patch("/api/profile", {
    name: legacyUsers[0].name,
    photo: "https://res.cloudinary.com/someone-else/image/upload/x.png",
  });
  expectThat(
    "photos from another Cloudinary account are rejected",
    foreignPhoto.status === 400
  );
};
