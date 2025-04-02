// Import the functions you need from the Firebase SDK
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVTJmwVZokfkEHH-F5hpfaWkTofqUBTBQ",
  authDomain: "customer-management-61f84.firebaseapp.com",
  databaseURL: "https://customer-management-61f84-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "customer-management-61f84",
  storageBucket: "customer-management-61f84.firebasestorage.app",
  messagingSenderId: "556155206627",
  appId: "1:556155206627:web:2500614b6bf65aa23cfed6",
  measurementId: "G-9F9RFH4TQZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Realtime Database
const db = getDatabase(app);

// Export the database instance so it can be used in other files
export { db };
