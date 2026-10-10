import "server-only";
import type { AppointmentView, ProfileView, Session } from "@/types/domain";
import type { UserRecord } from "@/types/firebase";
import { DEFAULT_AVATAR_URL } from "../../shared/booking";
import { findDoctorById, listPatientAppointments } from "./appointments";
import { text, toProfileView } from "./projections";

const withCurrentDoctorDetails = async (
  appointments: AppointmentView[]
): Promise<AppointmentView[]> => {
  const doctorIds = [...new Set(appointments.map((item) => item.doctorId))];
  const doctors = await Promise.all(doctorIds.map(findDoctorById));
  const doctorsById = new Map(
    doctorIds.map((id, index) => [id, doctors[index] ?? null] as const)
  );

  return appointments.map((appointment) => {
    const doctor = doctorsById.get(appointment.doctorId)?.record;
    return {
      ...appointment,
      doctor: {
        id: appointment.doctorId || "unknown",
        name: doctor?.name || "Unknown Doctor",
        photo: doctor?.photo || DEFAULT_AVATAR_URL,
        phone: text(doctor?.phone) || "Not available",
      },
    };
  });
};

export interface PatientDashboard {
  profile: ProfileView;
  bookings: AppointmentView[];
}

export const getPatientDashboard = async (
  session: Session<UserRecord>
): Promise<PatientDashboard> => ({
  profile: toProfileView(session),
  bookings: await withCurrentDoctorDetails(
    await listPatientAppointments(session.key)
  ),
});
