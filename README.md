# OSM – Outpatient Management System

Next.js 16 (App Router) clinic site backed by Firebase Realtime Database and Firebase Authentication.

## Architecture

- **The browser never talks to Firebase.** All reads and writes go through Next.js server code using the Firebase Admin SDK (`src/lib/server`). Database rules (`database.rules.json`) deny all client access.
- **Authentication:** email/password via Firebase Auth. The server signs the user in and sets an `httpOnly` session cookie. The role is read from the database on every request; it is never taken from the client.
- **Public data** (doctors, services, reviews) is served as sanitized projections. Emails, phone numbers and passwords never reach public pages.
- **Booking:** the server builds each appointment from trusted records. The client only sends a doctor ID and a time slot, and both are validated against the doctor's schedule. Queue numbers are reserved atomically and never reuse a number after a deletion; repeated submissions within 30 seconds create one booking.
- **Abuse limits:** sign-in, registration, password reset, booking, reviews, password changes and upload signing are rate limited. Password changes require a sign-in within the last hour.

## Environment variables

Copy `.env.example` and set:

| Variable | Scope | Notes |
|---|---|---|
| `FIREBASE_PROJECT_ID` | server | `osm-db-e7406` |
| `FIREBASE_DATABASE_URL` | server | `https://osm-db-e7406-default-rtdb.firebaseio.com` |
| `FIREBASE_WEB_API_KEY` | server | Web API key from Firebase project settings |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | server, **secret** | Service-account JSON (one line). Never commit it. |
| `NEXT_PUBLIC_SITE_URL` | public | Production origin, used for canonical URLs and the sitemap |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | public | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | server, **secret** | Enables signed uploads (recommended) |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | public | Only used as a fallback while signing is not configured |
| `CLINIC_NAME`, `CLINIC_STREET_ADDRESS`, `CLINIC_CITY`, `CLINIC_REGION`, `CLINIC_POSTAL_CODE`, `CLINIC_COUNTRY`, `CLINIC_PHONE`, `CLINIC_EMAIL`, `CLINIC_LATITUDE`, `CLINIC_LONGITUDE` | server | Optional. Real clinic details for local search structured data. Nothing is invented when they are empty |

Without `FIREBASE_SERVICE_ACCOUNT_KEY` the app runs **read-only**: public pages render existing data through the database's public REST endpoint, and sign-in and every change return a clear 503. Nothing is written in this mode.

`FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` can replace `FIREBASE_SERVICE_ACCOUNT_KEY`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `npm run build` / `npm start` | Next.js |
| `npm run lint` | ESLint (Next.js rules, 300-line file limit, no `any`, no `@ts-` suppressions) |
| `npm run typecheck` | TypeScript strict type check |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Builds and runs 269 end-to-end checks against the local Firebase emulators (project `demo-osm`, synthetic data only; requires Java) |
| `npm run check:env` | Validates production environment variables offline (never prints values). Use `node --env-file=<file> scripts/check-production-env.ts` to check a specific file |
| `npm run migrate:accounts` | Batch-migrates legacy plaintext-password accounts to Firebase Auth (dry run unless `--apply`). `--decisions=<file>` resolves duplicate-email groups explicitly (`DUPLICATE_AUTH_IDENTITY`, `AUTH_REQUIRES_EMAIL`); `--plan-out=<file>` writes the per-record mapping without passwords. Keep both files outside the repository. |

## Search and AI discovery

- Every public page has metadata, a canonical URL and Open Graph/Twitter cards with a generated image (`app/opengraph-image.tsx`).
- Structured data: `MedicalOrganization`/`MedicalClinic` + `WebSite` site-wide, `Physician` with breadcrumbs on doctor pages, breadcrumbs and doctor lists on service pages.
- `/sitemap.xml` and `/robots.txt` are generated. AI answer engines (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended) are allowed on public pages only.
- `/llms.txt` gives AI assistants a plain-text summary of the clinic, its services and doctors, built from public data only.

## Existing data compatibility

The app adapts to the existing database; it never requires records to be edited by hand:

- Numeric or string IDs, object- or array-shaped lists, array-style keys (`"0"`, `"1"`), mixed-case emails, string ticket prices and legacy gender or day values are all read as they are.
- Updates only write fields that actually changed, merge instead of replacing, keep unknown fields, and keep legacy formats.
- New additive nodes only: `authLinks` (login ↔ record mapping), `appointmentQueues` (atomic queue numbers) and `rateLimits` (hashed keys, no personal data). Records gain an `authUid` field when their login migrates.

## Going live (order matters)

1. **Back up the database** (Firebase console → Realtime Database → Export JSON).
2. **Enable the Email/Password provider** in Firebase Authentication.
3. **Set the environment variables** above in the hosting provider.
4. **Deploy the Next.js app.** It works with the current database rules because the server uses the Admin SDK.
5. **Deploy the database rules**: `npx firebase deploy --only database --project osm-db-e7406`. This only changes access rules, not data. It blocks the old Vite site's direct browser access, so do it after the new app is live.
6. **Legacy passwords migrate automatically.** On each user's first login, the server:
   - checks the old password on the server,
   - creates their Firebase Auth login,
   - verifies it by signing in,
   - removes only that record's `password` field.
   An existing Firebase login is never changed by an old password, so a user who has set a new password cannot be taken over with a leaked legacy one.
   Optionally, run `npm run migrate:accounts` (dry run), then `npm run migrate:accounts -- --apply --i-have-a-database-backup` to migrate everyone at once. Both paths are idempotent and never delete records.
7. **In Cloudinary**, set `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (`npm run check:env` fails without them), then disable the unsigned upload preset. Signed uploads are limited to JPG/PNG in fixed folders, get a server-chosen image id, and are resized to at most 1600×1600 on arrival. Existing images keep working.
8. **For local search**, set the `CLINIC_*` variables to the clinic's real address and phone. The Find Location map uses them when they are set.
9. **Replace template content** before launch. See "Content that needs real clinic information" below.

## Content that needs real clinic information

These texts came from the original template. They are shown as-is because the real facts are not in the repository:

- `src/assets/data/faqs.ts`: every answer is the same "One Medical…" text, and one question is duplicated.
- `src/components/home/HeroSection.tsx`: the "30+ years", "15+ clinic locations" and "100% patient satisfaction" figures.
- `src/components/home/About.tsx`: the US News ranking claim.
- `src/components/home/Testimonial.tsx`: sample testimonials.
- `src/components/home/VirtualTreatment.tsx`: sample appointment card and step text.
- `app/contact/page.tsx`: the "beta feature" wording.
- `app/find-location/page.tsx`: shows Melbourne until the `CLINIC_*` address is set.
- Ticket prices are labelled BDT in `src/components/doctors/details/Sidepanel.tsx` and `src/components/dashboard/patient/MyBookings.tsx`.
