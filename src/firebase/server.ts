
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let credential;
    // Check for the single service account variable first.
    // This is common for hosting providers like Vercel.
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
        // Fallback to individual variables if the single one is not provided.
        credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Replace escaped newlines if the key is passed directly
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
    } else {
        // This will typically only run in local development if no env vars are set.
        // In a deployed environment, one of the above should be true.
        console.warn("Firebase Admin SDK not initialized. Missing FIREBASE_SERVICE_ACCOUNT or individual Firebase environment variables.");
    }
    
    if (credential) {
        admin.initializeApp({ credential });
    }

  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
