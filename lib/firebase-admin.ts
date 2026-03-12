import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

function initializeAdmin() {
  console.log('Admin SDK: initializeAdmin called');
  if (admin.apps.length > 0) {
    console.log('Admin SDK: Already initialized');
    return admin.apps[0];
  }

  try {
    let serviceAccount: any = null;
    const cwd = process.cwd();
    const possiblePaths = [
      path.join(cwd, 'firebase-service-account.json'),
      path.join(cwd, '..', 'firebase-service-account.json'),
      path.join(cwd, 'public', 'firebase-service-account.json'),
      '/var/task/firebase-service-account.json', // Common Vercel path
    ];

    console.log('Admin SDK: Searching for service account...');
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        console.log(`Admin SDK: Found file at: ${p}`);
        const content = fs.readFileSync(p, 'utf8');
        serviceAccount = JSON.parse(content);
        break;
      }
    }

    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Admin SDK: Loading from Environment Variable...');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (!serviceAccount) {
      console.error('Admin SDK: No service account file or environment variable found');
      console.log('FIREBASE_SERVICE_ACCOUNT exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT);
    }

    if (serviceAccount && serviceAccount.private_key) {
      console.log('Admin SDK: Private key found, sanitizing...');
      // PROVEN SANITIZATION LOGIC from diagnostic V3
      let pureBase64 = serviceAccount.private_key
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s/g, '');
      
      const wrapped = pureBase64.match(/.{1,64}/g).join('\n');
      serviceAccount.private_key = `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----\n`;

      console.log('Admin SDK: Initializing with project:', serviceAccount.project_id);
      
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`
      });
      console.log('Admin SDK: ✅ Successfully initialized');
      return app;
    } else {
      console.error('❌ Admin SDK: No valid service account found or missing private_key');
    }
  } catch (error: any) {
    console.error('❌ Admin SDK: Initialization error:', error.message);
    console.error(error.stack);
  }
  return null;
}

const app = initializeAdmin();

let adminAuthInstance = null;
let adminDbInstance = null;
let adminRealtimeInstance = null;

if (app) {
  try {
    adminAuthInstance = admin.auth(app);
    adminDbInstance = admin.firestore(app);
    adminRealtimeInstance = admin.database(app);
    console.log('Admin SDK: Auth, Firestore, and Database instances created');
  } catch (error) {
    console.error('Admin SDK: Error creating instances:', error);
  }
}

export const adminAuth = adminAuthInstance;
export const adminDb = adminDbInstance;
export const adminRealtime = adminRealtimeInstance;
