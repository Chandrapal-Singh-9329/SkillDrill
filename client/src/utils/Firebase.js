

import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "skilldrill-16011.firebaseapp.com",
  projectId: "skilldrill-16011",
  storageBucket: "skilldrill-16011.firebasestorage.app",
  messagingSenderId: "619073448174",
  appId: "1:619073448174:web:8d00a21bb1fb2eceffebff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const provider = new GoogleAuthProvider()



