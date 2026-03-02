import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

if (!admin.apps.length) {
  let serviceAccount: any = null;

  // Try from file first (local development)
  const jsonPath = path.join(process.cwd(), 'student-learing-56-firebase-adminsdk-fbsvc-1f6245e4f7.json');
  
  if (fs.existsSync(jsonPath)) {
    try {
      console.log('Loading Firebase Admin from JSON file...');
      serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      console.error('Error reading service account JSON file:', e);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('Loading Firebase Admin from Environment Variable...');
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env var:', e);
    }
  }

  if (serviceAccount && serviceAccount.project_id) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`
    });
    console.log('Firebase Admin initialized successfully');
  } else {
    console.error('Firebase Admin could not be initialized: No service account found');
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminRealtime = admin.database();
