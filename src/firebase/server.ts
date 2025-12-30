
import * as admin from 'firebase-admin';

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    let credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
        credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });
    } else {
        console.warn("Firebase Admin SDK not initialized. Missing FIREBASE_SERVICE_ACCOUNT or individual Firebase environment variables.");
        // Return null or throw error if no credentials found, to avoid crashing on getFirestore() etc.
        return null;
    }
    
    return admin.initializeApp({ credential });

  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    // Return null or throw error
    return null;
  }
}

// Ensures the app is initialized before returning the service
function getDb() {
  initializeAdminApp();
  return admin.firestore();
}

function getAuth() {
  initializeAdminApp();
  return admin.auth();
}

// Export getters instead of direct instances
const db = getDb();
const auth = getAuth();

export { admin, db, auth };
