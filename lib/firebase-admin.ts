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
      console.log(`Attempting to load Firebase Admin from: ${jsonPath}`);
      serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Attempting to load Firebase Admin from Environment Variable...');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }

    if (serviceAccount && serviceAccount.private_key) {
      console.log('Sanitizing private key...');
      
      // AGGRESSIVE SANITIZATION:
      // 1. Isolate the Base64 part by removing headers/footers
      const header = '-----BEGIN PRIVATE KEY-----';
      const footer = '-----END PRIVATE KEY-----';
      
      let pk = serviceAccount.private_key;
      let base64Part = pk;
      
      if (pk.includes(header)) base64Part = base64Part.split(header)[1];
      if (base64Part.includes(footer)) base64Part = base64Part.split(footer)[0];
      
      // 2. Remove EVERYTHING that isn't a valid Base64 character or the literal '\n' string
      // This strips real newlines, spaces, tabs, and corruption like ASN.1 byte issues
      base64Part = base64Part.replace(/\\n/g, ''); // Remove literal \n
      base64Part = base64Part.replace(/[^A-Za-z0-9+/=]/g, ''); // Remove all whitespace/garbage
      
      // 3. Reconstruct with standard 64-character PEM line breaks
      const lines = base64Part.match(/.{1,64}/g) || [];
      serviceAccount.private_key = `${header}\n${lines.join('\n')}\n${footer}\n`;

      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`
      });
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
