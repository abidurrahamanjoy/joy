// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAckqsP3uRZ7gBSpC72rFE-otbv23ePT18",
  authDomain: "abidur-rahman-joy.firebaseapp.com",
  projectId: "abidur-rahman-joy",
  storageBucket: "abidur-rahman-joy.firebasestorage.app",
  messagingSenderId: "164199220507",
  appId: "1:164199220507:web:51a2d037b580ca4a663fbe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
