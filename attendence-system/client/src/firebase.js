import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZqkM69wdziXrEQYtoOL3Hla1kTVhURFw",
  authDomain: "attendence-c7ddd.firebaseapp.com",
  projectId: "attendence-c7ddd",
  storageBucket: "attendence-c7ddd.firebasestorage.app",
  messagingSenderId: "354421804048",
  appId: "1:354421804048:web:bfdf65b5e216758bc58e95",
  measurementId: "G-HY2HDXL77G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);