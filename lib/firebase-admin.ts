import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

if (!admin.apps.length) {
  let serviceAccount: any = null;

  // Search for any JSON file that looks like a service account
  const cwd = process.cwd();
  const files = fs.readdirSync(cwd);
  const jsonFile = files.find(f => f.endsWith('.json') && f.includes('firebase-adminsdk'));
  
  const jsonPath = jsonFile ? path.join(cwd, jsonFile) : path.join(cwd, 'firebase-service-account.json');
  
  if (fs.existsSync(jsonPath)) {
    try {
      console.log(`Loading Firebase Admin from: ${jsonPath}`);
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
    // FIX: Ensure private key handles newlines correctly
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`
      });
      console.log('Firebase Admin initialized successfully');
    } catch (initError) {
      console.error('Firebase Admin initialization error:', initError);
    }
  } else {
    console.error('Firebase Admin could not be initialized: No valid service account found');
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminRealtime = admin.database();
