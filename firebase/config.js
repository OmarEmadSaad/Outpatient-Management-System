import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBYUKkHQD3wP3RCNthD1etjkUosqf9xacI",
  authDomain: "osm-db-e7406.firebaseapp.com",
  databaseURL: "https://osm-db-e7406-default-rtdb.firebaseio.com",
  projectId: "osm-db-e7406",
  storageBucket: "osm-db-e7406.appspot.com",
  messagingSenderId: "1098187793710",
  appId: "1:1098187793710:web:d01f88d0a718e87e3186bf",
  measurementId: "G-ELSJ3GHWL6",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getDatabase(app);
