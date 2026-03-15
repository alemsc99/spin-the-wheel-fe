import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBWklvaRb1REPx6ju8wEjR4zDs5vxRDBDY",
  authDomain: "spinwords.firebaseapp.com",
  projectId: "spinwords",
  storageBucket: "spinwords.firebasestorage.app",
  messagingSenderId: "64734295427",
  appId: "1:64734295427:web:1856608448c549ae6bb2b6",
  measurementId: "G-C9Z4P4CXNR"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Esporta gli strumenti che ti servono
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);