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

      // Stored as base64 to avoid newline formatting issues across environments
      const cleaned = Buffer.from(privateKey, 'base64').toString('utf8');

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
