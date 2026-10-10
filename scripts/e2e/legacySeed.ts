const PHOTO =
  "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg";
const OLD_HOST_PHOTO =
  "https://glitch-legacy.example.com/avatars/old-photo.png";

export const LEGACY_FIXTURE_PASSWORDS = {
  numericDoctor: "Legacy@55",
  arrayPatient: "Arraypat@12",
  mixedCasePatient: "Mixed@2024",
  spacedPatient: "Spaced@77",
  sharedPatient: "SharedPat@1",
  sharedDoctor: "SharedDoc@1",
  resetPatient: "ResetPat@1",
};

export const legacyUsers = {
  0: {
    id: "a123",
    name: "Array Patient",
    email: "arraypatient@example.com",
    password: LEGACY_FIXTURE_PASSWORDS.arrayPatient,
    photo: OLD_HOST_PHOTO,
    gender: "male",
    role: "patient",
    bloodType: "O-",
    legacyNote: "imported from json-server",
  },
  1: {
    id: "b456",
    name: "Mixed Case",
    email: "Legacy.User@Example.com",
    password: LEGACY_FIXTURE_PASSWORDS.mixedCasePatient,
    photo: PHOTO,
    gender: "Male",
    role: "patient",
  },
  "-Nspaced": {
    id: "c789",
    name: "Spaced Password",
    email: "spaced@example.com",
    password: `${LEGACY_FIXTURE_PASSWORDS.spacedPatient} `,
    photo: PHOTO,
    gender: "Female",
    role: "patient",
  },
};

export const sharedEmailUser = {
  id: "d111",
  name: "Shared Patient",
  email: "shared@example.com",
  password: LEGACY_FIXTURE_PASSWORDS.sharedPatient,
  photo: PHOTO,
  gender: "female",
  role: "patient",
};

export const resetTargetUser = {
  id: "e222",
  name: "Reset Target",
  email: "reset.target@example.com",
  password: LEGACY_FIXTURE_PASSWORDS.resetPatient,
  photo: PHOTO,
  gender: "female",
  role: "patient",
};

export const sharedEmailDoctor = {
  id: "shared1",
  name: "Dr Shared",
  email: "shared@example.com",
  password: LEGACY_FIXTURE_PASSWORDS.sharedDoctor,
  phone: "01200000001",
  gender: "female",
  specialization: "Neurology",
  ticketPrice: 180,
  photo: PHOTO,
  role: "doctor",
  timeSlots: [{ day: "Thu", startingTime: "09:00", endingTime: "11:00" }],
};

export const legacyDoctors = {
  "-Nnumeric": {
    id: 7,
    name: "Dr.Legacy Numeric",
    email: "Numeric.Doctor@Example.com",
    password: LEGACY_FIXTURE_PASSWORDS.numericDoctor,
    phone: "+20 100 000 0000",
    bio: "Pediatrics & family care",
    about: "",
    gender: "Male",
    specialization: "Pediatrics",
    ticketPrice: "250",
    photo: OLD_HOST_PHOTO,
    role: "doctor",
    avgRating: 4.8,
    totalRating: 272,
    totalPatients: 1500,
    hospital: "Mount Adora Hospital, Sylhet.",
    legacyNote: "keep me",
    qualifications: {
      q1: {
        startingDate: "2010-1-5",
        endingDate: "2015-06-30",
        degree: "MBBS",
        university: "Legacy University",
        certificateId: "CERT-99",
      },
    },
    experiences: [
      {
        startingDate: "2016-01-01",
        endingDate: "2020-01-01",
        position: "Sr. Surgeon",
        hospital: "Legacy Hospital",
      },
    ],
    timeSlots: [
      { day: "Tue", startingTime: "10:00", endingTime: "13:00" },
      { day: "Wed", startingTime: "9:30", endingTime: "12:00" },
    ],
  },
};

export const legacyServices = {
  "-Npediatrics": {
    id: "srv9",
    name: "Pediatrics",
    desc: "Children care",
    image: OLD_HOST_PHOTO,
    bgColor: "rgba(1, 181, 197, .2)",
    textColor: "#01B5C5",
  },
};

export const legacyAppointments = {
  0: {
    id: "app1690000000000legacy01",
    user: {
      id: "0",
      name: "Array Patient",
      email: "arraypatient@example.com",
      photo: OLD_HOST_PHOTO,
      gender: "male",
    },
    doctorId: 7,
    ticketPrice: "250",
    createdAt: "2025-03-01T08:00:00.000Z",
    state: "un",
    timeSlot: "Tue: 10:00 am - 01:00 pm",
    isPaid: false,
    queueNumber: 1,
    expectedTime: "10:15 AM",
    doctor: {
      id: 7,
      name: "Dr.Legacy Numeric",
      photo: OLD_HOST_PHOTO,
      phone: "+20 100 000 0000",
    },
    isCompleted: true,
  },
};

export const legacyReviews = {
  0: {
    id: "a1b2",
    userId: "0",
    doctorId: 7,
    rating: 10,
    reviewText: "Great with kids",
    createdAt: "2025-03-02T08:00:00.000Z",
    role: "patient",
  },
};
