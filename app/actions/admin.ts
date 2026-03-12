"use server"

import { adminDb, adminRealtime } from "@/lib/firebase-admin"
import { auth, db, realtimeDb } from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from "firebase/auth"
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, deleteDoc, query, where } from "firebase/firestore"
import { ref, get, remove } from "firebase/database"

const ADMIN_EMAIL = "admin@123.in"
const ADMIN_USERNAME = "Mega"
const DEFAULT_PASSWORD = "student"

export async function listAllUsersAdmin() {
  console.log("Admin Action: listAllUsersAdmin called")

  const adminResult = await listUsersFromAdminSdk()
  if (adminResult.success) {
    return adminResult
  }

  console.warn(
    "Admin Action: Admin SDK user listing failed, trying client SDK fallback:",
    adminResult.error
  )

  const fallbackResult = await listUsersFromFirestore()
  if (fallbackResult.success) {
    return fallbackResult
  }

  if (!adminDb && typeof fallbackResult.error === "string" && fallbackResult.error.includes("Access denied")) {
    return {
      success: false,
      error: "Admin SDK is not configured on the server. Add firebase-service-account.json (or FIREBASE_SERVICE_ACCOUNT) to allow admin reads."
    }
  }

  return fallbackResult
}

function toIsoDate(value: any): string | null {
  if (!value) return null
  if (typeof value === "string") return value

  if (typeof value === "number") {
    const asDate = new Date(value)
    return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString()
  }

  if (value instanceof Date) return value.toISOString()

  if (typeof value?.toDate === "function") {
    const asDate = value.toDate()
    return asDate instanceof Date ? asDate.toISOString() : null
  }

  return null
}

function normalizeEmail(value: any): string {
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

function dedupeUsersByIdentity(users: any[]): any[] {
  const map = new Map<string, any>()
  const withoutIdentity: any[] = []

  for (const user of users) {
    const emailKey = normalizeEmail(user?.email)
    const uidKey = typeof user?.uid === "string" ? user.uid.trim() : ""
    const identityKey = emailKey || uidKey

    if (!identityKey) {
      withoutIdentity.push(user)
      continue
    }

    const existing = map.get(identityKey)
    if (!existing) {
      map.set(identityKey, user)
      continue
    }

    const existingDate = Date.parse(toIsoDate(existing?.createdAt || existing?.created_at) || "")
    const incomingDate = Date.parse(toIsoDate(user?.createdAt || user?.created_at) || "")

    // Keep the newest record when duplicates share the same account identity.
    if (Number.isFinite(incomingDate) && (!Number.isFinite(existingDate) || incomingDate >= existingDate)) {
      map.set(identityKey, { ...existing, ...user })
    } else {
      map.set(identityKey, { ...user, ...existing })
    }
  }

  return [...map.values(), ...withoutIdentity]
}

async function listUsersFromAdminSdk() {
  console.log("Admin Action: listUsersFromAdminSdk starting...")

  try {
    if (!adminDb) {
      console.warn("Admin SDK 'adminDb' is not initialized")
      return { success: false, error: "Admin SDK not initialized" }
    }

    const [profilesSnapshot, usersSnapshot] = await Promise.all([
      adminDb.collection("profiles").get(),
      adminDb.collection("users").get()
    ])

    console.log(`Found ${profilesSnapshot.size} docs in 'profiles' collection via Admin SDK`)
    console.log(`Found ${usersSnapshot.size} docs in 'users' collection via Admin SDK`)

    const mergedUsers = new Map<string, any>()

    for (const profileDoc of profilesSnapshot.docs) {
      const data = profileDoc.data() as any
      const uid = data.id || profileDoc.id
      mergedUsers.set(uid, { uid, ...data })
    }

    for (const userDoc of usersSnapshot.docs) {
      const data = userDoc.data() as any
      const uid = data.uid || userDoc.id
      mergedUsers.set(uid, { ...mergedUsers.get(uid), uid, ...data })
    }

    const usersList: any[] = []

    for (const userData of mergedUsers.values()) {
      const uid = userData.uid
      if (!uid || !userData.email) continue
      if (userData.email === ADMIN_EMAIL) continue
      if (userData.deleted === true) continue

      // Get progress from Realtime DB if possible
      let progressData: any = {}
      try {
        if (adminRealtime) {
          const progressSnapshot = await adminRealtime.ref(`users/${uid}/learning`).get()
          if (progressSnapshot.exists()) {
            progressData = progressSnapshot.val()
          }
        }
      } catch {
        console.warn(`No progress data for ${uid}`)
      }

      usersList.push({
        uid,
        email: userData.email,
        username: userData.username || "Unknown",
        role: userData.role || "student",
        createdAt: toIsoDate(userData.created_at || userData.createdAt) || new Date().toISOString(),
        deletionRequested: userData.deletionRequested || false,
        deletionRequestedAt: toIsoDate(userData.deletionRequestedAt),
        progress: progressData
      })
    }

    const dedupedUsers = dedupeUsersByIdentity(usersList)
    if (dedupedUsers.length !== usersList.length) {
      console.log(`Deduplicated admin users list: ${usersList.length} -> ${dedupedUsers.length}`)
    }

    dedupedUsers.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return { success: true, users: dedupedUsers }
  } catch (err: any) {
    console.error("Error listing users with Admin SDK:", err)
    return { success: false, error: err?.message || "Admin SDK user listing failed" }
  }
}

async function listUsersFromFirestore() {
  console.log("Admin Action: listUsersFromFirestore starting...");
  try {
    if (!db) {
        console.error("Client SDK 'db' is not initialized");
        return { success: false, error: "Database not initialized" };
    }
    
    const profilesRef = collection(db, "profiles")
    let profilesSnapshot;
    try {
        profilesSnapshot = await getDocs(profilesRef)
        console.log(`Found ${profilesSnapshot.size} docs in 'profiles' collection`);
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            console.error("Permission denied accessing profiles. Cannot list users.");
            return { success: false, error: "Access denied to user profiles. Check Firestore rules." };
        }
        throw e;
    }
    
    const usersList: any[] = []
    
    for (const doc of profilesSnapshot.docs) {
      const data = doc.data()
      const uid = data.id || doc.id
      
      if (data.email === ADMIN_EMAIL) continue
      
      // Get progress from Realtime DB if possible
      let progressData = {}
      try {
        if (realtimeDb) {
            const progressRef = ref(realtimeDb, `users/${uid}/learning`)
            const snap = await get(progressRef)
            if (snap.exists()) {
                progressData = snap.val()
            }
        }
      } catch {
        console.warn(`No progress data for ${uid}`)
      }
      
      usersList.push({
        uid: uid,
        email: data.email,
        username: data.username || "Unknown",
        role: data.role || "student",
        createdAt: data.created_at || new Date().toISOString(),
        deletionRequested: data.deletionRequested || false,
        deletionRequestedAt: data.deletionRequestedAt || null,
        progress: progressData
      })
    }

    const dedupedUsers = dedupeUsersByIdentity(usersList)
    if (dedupedUsers.length !== usersList.length) {
      console.log(`Deduplicated fallback users list: ${usersList.length} -> ${dedupedUsers.length}`)
    }

    return { success: true, users: dedupedUsers }
  } catch (err: any) {
    console.error("Error in fallback listUsers:", err)
    return { success: false, error: err.message }
  }
}

export async function createAdminUser() {
  try {
    // Check if admin already exists
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", ADMIN_EMAIL))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      return { success: true, message: "Admin user already exists" }
    }

    // Create admin user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, "admin123")
    const user = userCredential.user

    // Update profile
    await updateProfile(user, { displayName: ADMIN_USERNAME })

    // Create admin profile in Firestore
    const adminData = {
      uid: user.uid,
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      role: "admin",
      createdAt: new Date().toISOString(),
      deleted: false,
      deletedAt: null,
      restoreBefore: null
    }

    await setDoc(doc(db, "users", user.uid), adminData)

    return { success: true, message: "Admin user created successfully" }
  } catch (err: any) {
    console.error("Admin creation error:", err)
    return { success: false, error: err.message }
  }
}

export async function checkAdminStatus(email: string) {
  if (email === ADMIN_EMAIL) {
    return { isAdmin: true }
  }
  return { isAdmin: false }
}

export async function getAllUsers() {
  console.log("getAllUsers starting...");
  try {
    // Try to get from 'users' collection first
    const usersRef = collection(db, "users")
    const querySnapshot = await getDocs(usersRef)
    console.log(`Found ${querySnapshot.size} docs in 'users' collection`);
    
    let userDocs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { ...data, uid: data.uid || doc.id };
    })
    
    // If 'users' collection is empty or has very few users, check 'profiles' as well
    // This handles users created before the dual-write update
    const profilesRef = collection(db, "profiles")
    const profilesSnapshot = await getDocs(profilesRef)
    console.log(`Found ${profilesSnapshot.size} docs in 'profiles' collection`);
    
    const profileDocs = profilesSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        uid: data.id || doc.id,
        email: data.email,
        username: data.username,
        role: data.role || "student",
        createdAt: data.created_at || new Date().toISOString(),
        deleted: data.deleted || false
      }
    })

    // Merge them, prioritizing 'users' collection data
    const mergedUsersMap = new Map()
    
    profileDocs.forEach(u => mergedUsersMap.set(u.uid, u))
    userDocs.forEach(u => mergedUsersMap.set(u.uid, { ...mergedUsersMap.get(u.uid), ...u }))
    
    console.log(`Total merged users: ${mergedUsersMap.size}`);
    
    const users: any[] = []
    
    for (const userData of mergedUsersMap.values()) {
      // Skip admin user from the list to avoid self-management
      if (userData.email === ADMIN_EMAIL) {
        console.log("Skipping admin user:", userData.email);
        continue
      }

      if (userData.deleted === true) {
        console.log("Skipping deleted user:", userData.email);
        continue;
      }
      
      // Get progress from Realtime Database
      let progressData: any = {}
      try {
        const progressRef = ref(realtimeDb, `users/${userData.uid}/learning`)
        const progressSnapshot = await get(progressRef)
        if (progressSnapshot.exists()) {
          progressData = progressSnapshot.val()
        }
      } catch {
        console.log("No progress data for user:", userData.uid)
      }
      
      users.push({
        uid: userData.uid,
        email: userData.email,
        username: userData.username,
        role: userData.role || "student",
        createdAt: userData.createdAt,
        deleted: userData.deleted || false,
        deletedAt: userData.deletedAt,
        restoreBefore: userData.restoreBefore,
        progress: progressData
      })
    }
    
    console.log(`Returning ${users.length} active users`);
    return { success: true, users }
  } catch (err: any) {
    console.error("Error fetching users:", err)
    return { success: false, error: err.message }
  }
}

export async function getUserDetails(userId: string) {
  try {
    // Get user profile
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return { success: false, error: "User not found" }
    }
    
    const userData = userDoc.data()
    
    // Get progress from Realtime Database
    let progressData: any = {}
    let overallData: any = {}
    
    try {
      const progressRef = ref(realtimeDb, `users/${userId}/learning`)
      const progressSnapshot = await get(progressRef)
      if (progressSnapshot.exists()) {
        const data = progressSnapshot.val()
        progressData = data.courses || {}
        overallData = data.overallProgress || {}
      }
    } catch {
      console.log("No progress data")
    }
    
    // Get quiz attempts from Firestore
    const quizAttemptsRef = collection(db, "quiz_attempts")
    const quizQuery = query(quizAttemptsRef, where("user_id", "==", userId))
    const quizSnapshot = await getDocs(quizQuery)
    const quizAttempts = quizSnapshot.docs.map(doc => doc.data())
    
    // Get focus analytics from Firestore
    const focusRef = collection(db, "focus_analytics")
    const focusQuery = query(focusRef, where("user_id", "==", userId))
    const focusSnapshot = await getDocs(focusQuery)
    const focusAnalytics = focusSnapshot.docs.map(doc => doc.data())
    
    return {
      success: true,
      user: {
        ...userData,
        progress: progressData,
        overall: overallData,
        quizAttempts,
        focusAnalytics
      }
    }
  } catch (err: any) {
    console.error("Error fetching user details:", err)
    return { success: false, error: err.message }
  }
}

export async function softDeleteUser(userId: string) {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      return { success: false, error: "User not found" }
    }
    
    const userData = userDoc.data()
    
    // Check if it's admin
    if (userData.email === ADMIN_EMAIL) {
      return { success: false, error: "Cannot delete admin user" }
    }
    
    // Set soft delete with 7-day restore window
    const deletedAt = Date.now()
    const restoreBefore = deletedAt + (7 * 24 * 60 * 60 * 1000) // 7 days
    
    await updateDoc(userRef, {
      deleted: true,
      deletedAt: deletedAt,
      restoreBefore: restoreBefore
    })
    
    // Remove from Realtime Database (soft delete)
    try {
      await remove(ref(realtimeDb, `users/${userId}`))
    } catch {
      console.log("No Realtime DB data to remove")
    }
    
    return { 
      success: true, 
      message: "User deleted. Can be restored within 7 days.",
      restoreBefore: restoreBefore
    }
  } catch (err: any) {
    console.error("Error deleting user:", err)
    return { success: false, error: err.message }
  }
}

export async function restoreUser(userId: string) {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      return { success: false, error: "User not found" }
    }
    
    // Restore user
    await updateDoc(userRef, {
      deleted: false,
      deletedAt: null,
      restoreBefore: null
    })
    
    return { success: true, message: "User restored successfully" }
  } catch (err: any) {
    console.error("Error restoring user:", err)
    return { success: false, error: err.message }
  }
}

export async function permanentDeleteUser(userId: string) {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      return { success: false, error: "User not found" }
    }
    
    const userData = userDoc.data()
    
    // Check if it's admin
    if (userData.email === ADMIN_EMAIL) {
      return { success: false, error: "Cannot delete admin user" }
    }
    
    // Delete from Firestore
    await deleteDoc(userRef)
    
    // Delete from Realtime Database
    try {
      await remove(ref(realtimeDb, `users/${userId}`))
    } catch {
      console.log("No Realtime DB data")
    }
    
    // Note: Actual Firebase Auth user deletion requires Admin SDK
    // For now, we just mark as permanently deleted in Firestore
    
    return { success: true, message: "User permanently deleted" }
  } catch (err: any) {
    console.error("Error permanently deleting user:", err)
    return { success: false, error: err.message }
  }
}

export async function resetUserPassword(userId: string) {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) {
      return { success: false, error: "User not found" }
    }
    
    const userData = userDoc.data()
    
    if (userData.email === ADMIN_EMAIL) {
      return { success: false, error: "Cannot reset admin password" }
    }
    
    await updateDoc(userRef, {
      passwordResetRequired: true,
      defaultPasswordSet: DEFAULT_PASSWORD,
      passwordResetAt: Date.now()
    })
    
    try {
      await sendPasswordResetEmail(auth, userData.email)
    } catch (emailErr) {
      console.log("Password reset email error:", emailErr)
    }
    
    return { 
      success: true, 
      message: `Password reset email sent to ${userData.email}. Default password: ${DEFAULT_PASSWORD}`
    }
  } catch (err: any) {
    console.error("Error resetting password:", err)
    return { success: false, error: err.message }
  }
}

export async function getDeletedUsers() {
  try {
    const usersRef = collection(db, "users")
    const querySnapshot = await getDocs(usersRef)
    
    const profilesRef = collection(db, "profiles")
    const profilesSnapshot = await getDocs(profilesRef)
    
    const mergedUsersMap = new Map()
    
    profilesSnapshot.docs.forEach(doc => {
      const data = doc.data()
      const uid = data.id || doc.id
      mergedUsersMap.set(uid, { uid, ...data })
    })
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data()
      const uid = data.uid || doc.id
      mergedUsersMap.set(uid, { ...mergedUsersMap.get(uid), ...data })
    })
    
    const deletedUsers: any[] = []
    
    for (const userData of mergedUsersMap.values()) {
      if (userData.deleted === true) {
        deletedUsers.push({
          uid: userData.uid,
          email: userData.email,
          username: userData.username,
          deletedAt: userData.deletedAt,
          restoreBefore: userData.restoreBefore
        })
      }
    }
    
    return { success: true, deletedUsers }
  } catch (err: any) {
    console.error("Error fetching deleted users:", err)
    return { success: false, error: err.message }
  }
}

