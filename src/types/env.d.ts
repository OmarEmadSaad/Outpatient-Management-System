declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: "development" | "production" | "test";
    readonly FIREBASE_PROJECT_ID?: string;
    readonly FIREBASE_DATABASE_URL?: string;
    readonly FIREBASE_WEB_API_KEY?: string;
    readonly FIREBASE_SERVICE_ACCOUNT_KEY?: string;
    readonly FIREBASE_CLIENT_EMAIL?: string;
    readonly FIREBASE_PRIVATE_KEY?: string;
    readonly FIREBASE_AUTH_EMULATOR_HOST?: string;
    readonly FIREBASE_DATABASE_EMULATOR_HOST?: string;
    readonly CLOUDINARY_API_KEY?: string;
    readonly CLOUDINARY_API_SECRET?: string;
    readonly NEXT_PUBLIC_SITE_URL?: string;
    readonly NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?: string;
    readonly NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?: string;
    readonly VERCEL_PROJECT_PRODUCTION_URL?: string;
    readonly CLINIC_NAME?: string;
    readonly CLINIC_STREET_ADDRESS?: string;
    readonly CLINIC_CITY?: string;
    readonly CLINIC_REGION?: string;
    readonly CLINIC_POSTAL_CODE?: string;
    readonly CLINIC_COUNTRY?: string;
    readonly CLINIC_PHONE?: string;
    readonly CLINIC_EMAIL?: string;
    readonly CLINIC_LATITUDE?: string;
    readonly CLINIC_LONGITUDE?: string;
  }
}
