
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let credential;
    // Vercel and other platforms often handle multiline secrets well,
    // but sometimes you need to base64 encode it. For now, we assume it's a stringified JSON.
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        credential = admin.credential.cert(serviceAccount);
    } else {
        // Fallback to individual variables if the single one is not provided.
        credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Replace escaped newlines if the key is passed directly
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    }
    
    admin.initializeApp({ credential });

  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
