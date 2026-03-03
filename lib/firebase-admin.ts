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
      console.log(`Admin SDK: Loading from file: ${jsonPath}`);
      serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Admin SDK: Loading from Environment Variable...');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }

    if (serviceAccount && serviceAccount.private_key) {
      // PROVEN SANITIZATION LOGIC from diagnostic V3
      let pureBase64 = serviceAccount.private_key
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '');
      
      const wrapped = pureBase64.match(/.{1,64}/g).join('\n');
      serviceAccount.private_key = `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----\n`;

      console.log('Admin SDK: Initializing with project:', serviceAccount.project_id);
      
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`
      });
    } else {
      console.error('❌ Admin SDK: No valid service account found');
    }
  } catch (error: any) {
    console.error('❌ Admin SDK: Initialization error:', error.message);
  }
  return null;
}

const app = initializeAdmin();

export const adminAuth = app ? admin.auth(app) : null;
export const adminDb = app ? admin.firestore(app) : null;
export const adminRealtime = app ? admin.database(app) : null;
