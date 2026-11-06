// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCYzKTgPJsftAPgW1uV4t-ConZxLYCm_as",
  authDomain: "r17-repair.firebaseapp.com",
  databaseURL: "https://r17-repair-default-rtdb.firebaseio.com",
  projectId: "r17-repair",
  storageBucket: "r17-repair.firebasestorage.app",
  messagingSenderId: "341565633454",
  appId: "1:341565633454:web:b2c36bb28eb0c344e28e3f",
  measurementId: "G-5YHMSY98K7"
};

// Mencegah duplikasi inisialisasi di Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const database = getDatabase(app);