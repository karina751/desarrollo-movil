import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
 apiKey: "AIzaSyC4L8HtxWfyvnN_B5B3NxIZjBoCo-KqtkQ",
  authDomain: "mobilestart-c0cc7.firebaseapp.com",
  projectId: "mobilestart-c0cc7",
  storageBucket: "mobilestart-c0cc7.firebasestorage.app",
  messagingSenderId: "47873865647",
  appId: "1:47873865647:web:5d656991e95ad8a4fb615a"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };

