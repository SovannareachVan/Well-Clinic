// Import necessary Firebase functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getDatabase, ref, set, push } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Your Firebase config (make sure these values are from your Firebase Console)
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

// Export the database instance for use in other files
export { db };
