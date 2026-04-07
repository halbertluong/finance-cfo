import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;

try {
  _app = getApps().length === 0
    ? initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      })
    : getApps()[0];
  _auth = getAuth(_app);
} catch (e) {
  console.error('Firebase initialization failed:', e);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const auth = _auth!;
export const googleProvider = new GoogleAuthProvider();
