import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const databaseURL =
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    (projectId ? `https://${projectId}-default-rtdb.firebaseio.com` : undefined);

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    databaseURL,
};

// True only when there's enough config to actually talk to a database.
// The "Play online" entry point stays disabled otherwise.
export const firebaseReady = Boolean(firebaseConfig.apiKey && databaseURL);

export const db = firebaseReady
    ? getDatabase(initializeApp(firebaseConfig))
    : null;
