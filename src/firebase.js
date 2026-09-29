// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD4XOatybsxJDjxcQgqaVWTrnsjqCL-CH4",
  authDomain: "cloud-assignment-portal-c6340.firebaseapp.com",
  projectId: "cloud-assignment-portal-c6340",
  storageBucket: "cloud-assignment-portal-c6340.firebasestorage.app",
  messagingSenderId: "303389591751",
  appId: "1:303389591751:web:37d4d6f5817cc856b556e2",
  measurementId: "G-G3X5M27NPG"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);