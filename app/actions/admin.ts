"use server"

import { auth, db, realtimeDb } from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from "firebase/auth"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, deleteDoc, query, where } from "firebase/firestore"
import { ref, set, get, remove } from "firebase/database"

const ADMIN_EMAIL = "admin@123.in"
const ADMIN_USERNAME = "Mega"
const DEFAULT_PASSWORD = "student"

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
      } catch (e) {
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
    let coursesData: any = {}
    
    try {
      const progressRef = ref(realtimeDb, `users/${userId}/learning`)
      const progressSnapshot = await get(progressRef)
      if (progressSnapshot.exists()) {
        const data = progressSnapshot.val()
        progressData = data.courses || {}
        overallData = data.overallProgress || {}
      }
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
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
