import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'

type ServiceAccountLike = {
  project_id: string
  client_email: string
  private_key: string
  [key: string]: any
}

function normalizePrivateKey(privateKey: string): string {
  if (!privateKey) return privateKey

  const unescaped = privateKey.replace(/\\n/g, '\n').trim()
  if (unescaped.includes('-----BEGIN PRIVATE KEY-----')) {
    return unescaped
  }

  const pureBase64 = unescaped
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const wrapped = pureBase64.match(/.{1,64}/g)
  if (!wrapped) {
    return unescaped
  }

  return `-----BEGIN PRIVATE KEY-----\n${wrapped.join('\n')}\n-----END PRIVATE KEY-----\n`
}

function tryParseJson(input: string): any | null {
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}

function loadServiceAccount(): ServiceAccountLike | null {
  const cwd = process.cwd()
  const possiblePaths = [
    path.join(cwd, 'firebase-service-account.json'),
    path.join(cwd, '..', 'firebase-service-account.json'),
    path.join(cwd, 'public', 'firebase-service-account.json'),
    '/var/task/firebase-service-account.json'
  ]

  console.log('Admin SDK: Searching for service account...')

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`Admin SDK: Found file at: ${p}`)
      const content = fs.readFileSync(p, 'utf8')
      const parsed = tryParseJson(content)
      if (parsed) {
        return parsed as ServiceAccountLike
      }
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('Admin SDK: Loading from FIREBASE_SERVICE_ACCOUNT...')
    const parsed = tryParseJson(process.env.FIREBASE_SERVICE_ACCOUNT)
    if (parsed) {
      return parsed as ServiceAccountLike
    }
    console.error('Admin SDK: FIREBASE_SERVICE_ACCOUNT is not valid JSON')
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log('Admin SDK: Loading from FIREBASE_SERVICE_ACCOUNT_BASE64...')
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
      const parsed = tryParseJson(decoded)
      if (parsed) {
        return parsed as ServiceAccountLike
      }
      console.error('Admin SDK: FIREBASE_SERVICE_ACCOUNT_BASE64 decoded but JSON is invalid')
    } catch (error: any) {
      console.error('Admin SDK: Failed to decode FIREBASE_SERVICE_ACCOUNT_BASE64:', error?.message)
    }
  }

  const project_id = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''
  const client_email = process.env.FIREBASE_CLIENT_EMAIL || ''
  const private_key = process.env.FIREBASE_PRIVATE_KEY || ''

  if (project_id && client_email && private_key) {
    console.log('Admin SDK: Loading from split env vars (FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)...')
    return {
      project_id,
      client_email,
      private_key
    }
  }

  console.error('Admin SDK: No service account source found (file/env/base64/split vars)')
  return null
}

function initializeAdmin() {
  console.log('Admin SDK: initializeAdmin called')
  if (admin.apps.length > 0) {
    console.log('Admin SDK: Already initialized')
    return admin.apps[0]
  }

  try {
    const serviceAccount = loadServiceAccount()

    if (!serviceAccount || !serviceAccount.private_key || !serviceAccount.project_id || !serviceAccount.client_email) {
      console.error('Admin SDK: Missing required service account fields')
      return null
    }

    const normalizedServiceAccount: ServiceAccountLike = {
      ...serviceAccount,
      private_key: normalizePrivateKey(serviceAccount.private_key)
    }

    const databaseURL =
      process.env.FIREBASE_DATABASE_URL ||
      process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
      `https://${normalizedServiceAccount.project_id}-default-rtdb.asia-southeast1.firebasedatabase.app`

    console.log('Admin SDK: Initializing with project:', normalizedServiceAccount.project_id)

    const app = admin.initializeApp({
      credential: admin.credential.cert(normalizedServiceAccount as admin.ServiceAccount),
      databaseURL
    })

    console.log('Admin SDK: Successfully initialized')
    return app
  } catch (error: any) {
    console.error('Admin SDK: Initialization error:', error?.message)
    console.error(error?.stack)
    return null
  }
}

const app = initializeAdmin()

let adminAuthInstance = null
let adminDbInstance = null
let adminRealtimeInstance = null

if (app) {
  try {
    adminAuthInstance = admin.auth(app)
    adminDbInstance = admin.firestore(app)
    adminRealtimeInstance = admin.database(app)
    console.log('Admin SDK: Auth, Firestore, and Database instances created')
  } catch (error) {
    console.error('Admin SDK: Error creating instances:', error)
  }
}

export const adminAuth = adminAuthInstance
export const adminDb = adminDbInstance
export const adminRealtime = adminRealtimeInstance
