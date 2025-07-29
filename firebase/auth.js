// import { getAuth, onIdTokenChanged } from "firebase/auth";
// import { initializeApp, getApps, getApp } from "firebase/app";

// const firebaseConfig = {
//   apiKey: "AIzaSyBYUKkHQD3wP3RCNthD1etjkUosqf9xacI",
//   authDomain: "osm-db-e7406.firebaseapp.com",
//   databaseURL: "https://osm-db-e7406-default-rtdb.firebaseio.com",
//   projectId: "osm-db-e7406",
//   storageBucket: "osm-db-e7406.appspot.com",
//   messagingSenderId: "1098187793710",
//   appId: "1:1098187793710:web:d01f88d0a718e87e3186bf",
//   measurementId: "G-ELSJ3GHWL6",
// };

// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const auth = getAuth(app);

// export function initAuth() {
//   return onIdTokenChanged(auth, async (user) => {
//     if (user) {
//       try {
//         const token = await user.getIdToken();
//         localStorage.setItem("token", token);
//         localStorage.setItem("userId", user.uid);
//         console.log(
//           "Token updated successfully:",
//           token.substring(0, 10) + "..."
//         );
//       } catch (err) {
//         console.error("Error getting token:", err);
//         localStorage.removeItem("token");
//         localStorage.removeItem("userId");
//         localStorage.removeItem("role");
//       }
//     } else {
//       console.log("No user signed in, clearing token.");
//       localStorage.removeItem("token");
//       localStorage.removeItem("userId");
//       localStorage.removeItem("role");
//     }
//   });
// }

// export function getToken() {
//   const token = localStorage.getItem("token");
//   if (!token) {
//     console.warn("No token found in localStorage.");
//   }
//   return token;
// }

// export async function signOutUser() {
//   try {
//     await auth.signOut();
//     localStorage.removeItem("token");
//     localStorage.removeItem("userId");
//     localStorage.removeItem("role");
//     console.log("User signed out successfully.");
//   } catch (err) {
//     console.error("Error signing out:", err);
//   }
// }
