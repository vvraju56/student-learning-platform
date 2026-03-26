const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function testInit() {
  console.log('--- Firebase Admin Diagnostic V3 ---');
  const jsonPath = path.join(process.cwd(), 'firebase-service-account.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('File not found');
    return;
  }

  const sa = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const pk = sa.private_key;

  console.log('Project ID:', sa.project_id);
  
  // STRATEGY: EXACT PEM FORMATTING
  // 1. Remove all \n, \r, and spaces
  let pureBase64 = pk
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  console.log('Base64 Length:', pureBase64.length);
  
  // 2. Re-wrap at exactly 64 chars
  const wrapped = pureBase64.match(/.{1,64}/g).join('\n');
  const finalKey = `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----\n`;

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: sa.project_id,
        clientEmail: sa.client_email,
        privateKey: finalKey
      })
    }, 'test-app'); // Use a named app to avoid conflicts
    console.log('✅ SUCCESS!');
  } catch (err) {
    console.log('❌ FAILED with exact wrapping');
    
    // TRY 3: No wrapping at all, just single line (sometimes works better)
    try {
      const singleLineKey = `-----BEGIN PRIVATE KEY-----\n${pureBase64}\n-----END PRIVATE KEY-----\n`;
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: sa.project_id,
          clientEmail: sa.client_email,
          privateKey: singleLineKey
        })
      }, 'test-app-2');
      console.log('✅ SUCCESS with single-line body!');
    } catch (err2) {
      console.log('❌ FAILED with single-line body');
      console.error('Final Error:', err2.message);
    }
  }
}

testInit();
