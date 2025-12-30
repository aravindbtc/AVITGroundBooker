
import { getApps, initializeApp, cert, App } from "firebase-admin/app"
import { getFirestore, Firestore } from "firebase-admin/firestore"
import { getAuth, Auth } from "firebase-admin/auth"

function initializeAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      };

    if (!serviceAccount.projectId) {
      throw new Error("Firebase Admin SDK not initialized. Missing FIREBASE_PROJECT_ID or FIREBASE_SERVICE_ACCOUNT environment variables.");
    }
    
    return initializeApp({
      credential: cert(serviceAccount),
    });
}

let adminDb: Firestore;
let adminAuth: Auth;

export function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(initializeAdminApp());
  }
  return adminDb;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(initializeAdminApp());
  }
  return adminAuth;
}
