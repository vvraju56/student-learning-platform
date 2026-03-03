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
      let saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (saJson.includes('\\n')) {
        saJson = saJson.replace(/\\n/g, '\n');
      }
      serviceAccount = JSON.parse(saJson);
    }

    if (serviceAccount && serviceAccount.private_key) {
      let key = serviceAccount.private_key;
      key = key.replace(/\\n/g, '\n');
      key = key.replace(/\r/g, '');
      serviceAccount.private_key = key;

      console.log(`Key starts with: ${key.substring(0, 30)}...`);

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
