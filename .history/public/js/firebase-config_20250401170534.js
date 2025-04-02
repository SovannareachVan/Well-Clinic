// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuY7JOzrw4sp9qqOZ_DcYZFixrMUXBKio",
  authDomain: "customer-management-syst-8cb9e.firebaseapp.com",
  databaseURL: "https://customer-management-syst-8cb9e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "customer-management-syst-8cb9e",
  storageBucket: "customer-management-syst-8cb9e.appspot.com",
  messagingSenderId: "671327791621",
  appId: "1:671327791621:web:ef915738be80238db80a6c",
  measurementId: "G-YNJ27NE48Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Export the database instance
export { db };
