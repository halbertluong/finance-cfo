import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App | null = null;

function getAdminApp(): App {
  if (!app) {
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      if (!privateKey) throw new Error('FIREBASE_ADMIN_PRIVATE_KEY is not set');

      // Vercel stores the value without outer quotes but with literal \n
      // Strip surrounding quotes if present, then convert \n to real newlines
      const cleaned = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: cleaned,
        }),
      });
    }
  }
  return app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
