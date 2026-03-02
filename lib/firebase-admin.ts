import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  
  if (serviceAccount.project_id) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`
    });
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminRealtime = admin.database();
