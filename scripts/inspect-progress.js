const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function inspectUserProgress() {
  console.log('--- User Progress Inspector ---');
  const jsonPath = path.join(process.cwd(), 'firebase-service-account.json');
  const sa = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  
  let pk = sa.private_key.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
  const finalKey = '-----BEGIN PRIVATE KEY-----\n' + pk.match(/.{1,64}/g).join('\n') + '\n-----END PRIVATE KEY-----\n';

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ ...sa, privateKey: finalKey }),
      databaseURL: `https://${sa.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`
    });
  }

  const userId = '0JkDX6zFv4f7nJkRe1ISggX0WXo2'; 
  console.log(`Inspecting UID: ${userId}`);

  try {
    const db = admin.database();
    const snap = await db.ref(`users/${userId}`).get();
    
    if (snap.exists()) {
      console.log('Data found in Realtime DB:');
      const val = snap.val();
      console.log(JSON.stringify(val, null, 2));
      
      if (val.learning) {
        console.log('\n--- Learning Structure ---');
        console.log('Keys in learning:', Object.keys(val.learning));
        if (val.learning.courses) {
          console.log('Keys in courses:', Object.keys(val.learning.courses));
        }
      }
    } else {
      console.log('❌ No data found at path: users/' + userId);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit();
}

inspectUserProgress();
