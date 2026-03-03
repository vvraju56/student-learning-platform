import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

function initializeAdmin() {
  if (admin.apps.length > 0) return admin.apps[0];

  try {
    let serviceAccount: any = null;
    
    // 1. Try environment variable first (preferred for production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Admin SDK: Loading from ENV...');
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error('Admin SDK: ENV JSON parse failed');
      }
    }

    // 2. Fallback to file (preferred for local dev)
    if (!serviceAccount) {
      const jsonPath = path.join(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(jsonPath)) {
        console.log(`Admin SDK: Loading from file: ${jsonPath}`);
        try {
          serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        } catch (e) {
          console.error('Admin SDK: File JSON parse failed');
        }
      }
    }

    if (serviceAccount && serviceAccount.private_key) {
      // CLEAN PRIVATE KEY: Important for avoiding ASN.1 errors
      // Replace literal \n with actual newlines if they are escaped as strings
      if (typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      console.log('Admin SDK: Initializing with project:', serviceAccount.project_id);
      
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`
      });
    } else {
      console.error('❌ Admin SDK: No valid service account found in ENV or file');
    }
  } catch (error: any) {
    console.error('❌ Admin SDK: Initialization error:', error.message);
  }
  return null;
}

const app = initializeAdmin();

// Export initialized services
export const adminAuth = app ? admin.auth(app) : null;
export const adminDb = app ? admin.firestore(app) : null;
export const adminRealtime = app ? admin.database(app) : null;
