
import { getApps, initializeApp, cert, App } from "firebase-admin/app"
import { getFirestore, Firestore } from "firebase-admin/firestore"
import { getAuth, Auth } from "firebase-admin/auth"

function initializeAdminApp(): App {
    // If an app is already initialized, return it.
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // Otherwise, create a new app.
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key needs to have newlines escaped in the environment variable.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        // This will be caught by the calling function and should only happen if env vars are missing.
        throw new Error("Firebase Admin SDK environment variables are not set.");
    }
    
    return initializeApp({
      credential: cert(serviceAccount),
    });
}

// These are cached instances to avoid re-initialization on every call.
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
