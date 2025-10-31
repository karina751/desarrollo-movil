/**
 * MÓDULO: firebaseConfig.js
 * FUNCIÓN: Inicializa y configura la conexión con los servicios de Google Firebase.
 * -----------------------------------------------------------
 * - SEGURIDAD: Utiliza variables de entorno (process.env.EXPO_PUBLIC_...) para credenciales.
 * - EXPORTA: La instancia de Auth (Autenticación), db (Firestore, base de datos) y storage (archivos).
 * - ARQUITECTURA: Es un módulo central que permite la reutilización de la conexión en toda la app.
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; 
import { getStorage } from 'firebase/storage'; 

const firebaseConfig = {

  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// 🚨 Inicialización de Storage
const storage = getStorage(app); 


export { auth, db, storage };