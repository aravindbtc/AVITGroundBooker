
import { getApps, initializeApp, cert, App } from "firebase-admin/app"
import { getFirestore, Firestore } from "firebase-admin/firestore"
import { getAuth, Auth } from "firebase-admin/auth"

function initializeAdminApp(): App {
    // If an app is already initialized, return it.
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // Check if the single FIREBASE_SERVICE_ACCOUNT environment variable is set.
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        throw new Error("The FIREBASE_SERVICE_ACCOUNT environment variable is not set. It should contain the entire service account JSON as a single-line string.");
    }
    
    try {
        // Parse the service account JSON from the environment variable.
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

        return initializeApp({
            credential: cert(serviceAccount),
        });
    } catch (error: any) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT. Make sure it's a valid JSON string.", error);
        throw new Error("Failed to initialize Firebase Admin SDK. Check the FIREBASE_SERVICE_ACCOUNT environment variable.");
    }
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
