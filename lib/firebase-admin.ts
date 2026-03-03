import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

function initializeAdmin() {
  if (admin.apps.length > 0) return admin.apps[0];

  try {
    let serviceAccount: any = null;
    const cwd = process.cwd();
    const jsonPath = path.join(cwd, 'firebase-service-account.json');

    if (fs.existsSync(jsonPath)) {
      console.log(`Loading Firebase Admin from: ${jsonPath}`);
      const fileContent = fs.readFileSync(jsonPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Loading Firebase Admin from Environment Variable...');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }

    if (serviceAccount && serviceAccount.private_key) {
      // Standard Firebase Admin fix for private key formatting
      // 1. Replace literal "\n" strings with actual newline characters
      // 2. Remove any \r (carriage returns) from Windows-style line endings
      // 3. Ensure the key starts and ends cleanly
      
      let key = serviceAccount.private_key;
      
      // Fix literal escaped newlines if they exist
      key = key.replace(/\\n/g, '\n');
      
      // Fix Windows line endings
      key = key.replace(/\r/g, '');
      
      serviceAccount.private_key = key.trim() + '\n';

      // Diagnostic (Safe): Check if the key looks like a PEM key
      const lines = serviceAccount.private_key.split('\n');
      console.log(`Key diagnostic: ${lines.length} lines, starts with: ${lines[0].substring(0, 20)}...`);

      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`
      });
    } else {
      console.error('❌ Firebase Admin: No service account or private key found.');
    }
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
  }
  return null;
}

const app = initializeAdmin();

export const adminAuth = app ? admin.auth(app) : null;
export const adminDb = app ? admin.firestore(app) : null;
export const adminRealtime = app ? admin.database(app) : null;
