"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, query, where } from "firebase/firestore"
import { ref, get, remove } from "firebase/database"
import { auth, db, realtimeDb } from "../../lib/firebase"
import { softDeleteUser, restoreUser, permanentDeleteUser, resetUserPassword, getDeletedUsers } from "../../app/actions/admin"

const ADMIN_EMAIL = "admin@123.in"

// Client-side fetching function to replace the Server Action call
async function fetchAllUsersClient() {
  try {
    const usersRef = collection(db, "users")
    const querySnapshot = await getDocs(usersRef)
    let userDocs = querySnapshot.docs.map(doc => ({ ...doc.data(), uid: (doc.data() as any).uid || doc.id }))
    
    const profilesRef = collection(db, "profiles")
    const profilesSnapshot = await getDocs(profilesRef)
    const profileDocs = profilesSnapshot.docs.map(doc => {
      const data = doc.data() as any
      return {
        uid: data.id || doc.id,
        email: data.email,
        username: data.username,
        role: data.role || "student",
        createdAt: data.created_at || new Date().toISOString(),
        deleted: data.deleted || false
      }
    })

    const mergedUsersMap = new Map()
    profileDocs.forEach(u => mergedUsersMap.set(u.uid, u))
    userDocs.forEach((u: any) => mergedUsersMap.set(u.uid, { ...mergedUsersMap.get(u.uid), ...u }))
    
    const users: any[] = []
    for (const userData of mergedUsersMap.values()) {
      if (userData.email === ADMIN_EMAIL) continue
      if (userData.deleted === true) continue
      
      let progressData: any = {}
      try {
        const progressRef = ref(realtimeDb, `users/${userData.uid}/learning`)
        const progressSnapshot = await get(progressRef)
        if (progressSnapshot.exists()) {
          progressData = progressSnapshot.val()
        }
      } catch (e) {}
      
      users.push({ ...userData, progress: progressData })
    }
    return { success: true, users }
  } catch (err: any) {
    console.error("Client-side fetch error:", err)
    return { success: false, error: err.message }
  }
}

async function fetchDeletedUsersClient() {
  try {
    const profilesRef = collection(db, "profiles")
    const profilesSnapshot = await getDocs(profilesRef)
    const usersRef = collection(db, "users")
    const querySnapshot = await getDocs(usersRef)
    
    const mergedUsersMap = new Map()
    profilesSnapshot.docs.forEach(doc => {
      const data = doc.data() as any
      const uid = data.id || doc.id
      mergedUsersMap.set(uid, { uid, ...data })
    })
    querySnapshot.docs.forEach(doc => {
      const data = doc.data() as any
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
    return { success: false, error: err.message }
  }
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [deletedUsers, setDeletedUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null)
  const [activeTab, setActiveTab] = useState<"users" | "deleted">("users")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth?mode=signin")
        return
      }

      if (currentUser.email !== ADMIN_EMAIL) {
        router.push("/dashboard")
        return
      }

      setUser(currentUser)
      await loadUsers()
      await loadDeletedUsers()
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const loadUsers = async () => {
    try {
      const result = await fetchAllUsersClient()
      if (result.success && result.users) {
        setUsers(result.users)
      } else {
        setMessage({ type: "error", text: result.error || "Failed to load users" })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Exception loading users: " + err.message })
    }
  }

  const loadDeletedUsers = async () => {
    const result = await fetchDeletedUsersClient()
    if (result.success && result.deletedUsers) {
      setDeletedUsers(result.deletedUsers)
    }
  }

  const handleViewDetails = async (userId: string) => {
    setActionLoading(userId)
    try {
      // Fetch details directly on client, checking both collections
      let userDoc = await getDoc(doc(db, "users", userId))
      let userData: any = null
      
      if (userDoc.exists()) {
        userData = userDoc.data()
      } else {
        // Fallback to profiles
        const profileDoc = await getDoc(doc(db, "profiles", userId))
        if (profileDoc.exists()) {
          const pData = profileDoc.data()
          userData = {
            uid: userId,
            email: pData.email,
            username: pData.username,
            role: pData.role || "student",
            createdAt: pData.created_at
          }
        }
      }

      if (!userData) {
        setMessage({ type: "error", text: "User not found in any collection" })
        setActionLoading(null)
        return
      }
      
      let progressData = {}, overallData = {}
      
      try {
        const progressRef = ref(realtimeDb, `users/${userId}/learning`)
        const snap = await get(progressRef)
        if (snap.exists()) {
          const data = snap.val()
          progressData = data.courses || {}
          overallData = data.overallProgress || {}
        }
      } catch (e) {}

      const quizSnapshot = await getDocs(query(collection(db, "quiz_attempts"), where("user_id", "==", userId)))
      const quizAttempts = quizSnapshot.docs.map(doc => doc.data())
      
      const focusSnapshot = await getDocs(query(collection(db, "focus_analytics"), where("user_id", "==", userId)))
      const focusAnalytics = focusSnapshot.docs.map(doc => doc.data())

      setSelectedUser({
        ...userData,
        uid: userId,
        progress: progressData,
        overall: overallData,
        quizAttempts,
        focusAnalytics
      })
    } catch (err: any) {
      setMessage({ type: "error", text: "Error fetching details: " + err.message })
    }
    setActionLoading(null)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? They can be restored within 7 days.")) return
    
    setActionLoading(userId)
    try {
      const deletedAt = Date.now()
      const restoreBefore = deletedAt + (7 * 24 * 60 * 60 * 1000)

      // Use setDoc with merge to create the doc in 'users' if it only exists in 'profiles'
      await setDoc(doc(db, "users", userId), {
        deleted: true,
        deletedAt: deletedAt,
        restoreBefore: restoreBefore
      }, { merge: true })

      // Also mark in profiles if exists
      try {
        await setDoc(doc(db, "profiles", userId), { deleted: true }, { merge: true })
      } catch (e) {}

      setMessage({ type: "success", text: "User soft-deleted successfully" })
      await loadUsers()
      await loadDeletedUsers()
    } catch (err: any) {
      setMessage({ type: "error", text: "Delete error: " + err.message })
    }
    setActionLoading(null)
  }

  const handleRestoreUser = async (userId: string) => {
    if (!confirm("Restore this user? Their data will be restored.")) return
    
    setActionLoading(userId)
    try {
      await setDoc(doc(db, "users", userId), {
        deleted: false,
        deletedAt: null,
        restoreBefore: null
      }, { merge: true })
      
      try {
        await setDoc(doc(db, "profiles", userId), { deleted: false }, { merge: true })
      } catch (e) {}

      setMessage({ type: "success", text: "User restored successfully" })
      await loadUsers()
      await loadDeletedUsers()
    } catch (err: any) {
      setMessage({ type: "error", text: "Restore error: " + err.message })
    }
    setActionLoading(null)
  }

  const handlePermanentDelete = async (userId: string) => {
    if (!confirm("⚠️ PERMANENT DELETE! This cannot be undone. Are you sure?")) return
    
    setActionLoading(userId)
    try {
      // 1. Delete Firestore main records
      await deleteDoc(doc(db, "users", userId))
      await deleteDoc(doc(db, "profiles", userId))
      
      // 2. Delete Firestore related collections
      const collectionsToDelete = ["video_progress", "quiz_attempts", "focus_analytics"]
      for (const colName of collectionsToDelete) {
        const q = query(collection(db, colName), where("user_id", "==", userId))
        const snapshot = await getDocs(q)
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref))
        await Promise.all(deletePromises)
      }

      // 3. Delete from Realtime Database
      try {
        await remove(ref(realtimeDb, `users/${userId}`))
      } catch (e) {}

      setMessage({ type: "success", text: "User and all associated data permanently deleted" })
      await loadUsers()
      await loadDeletedUsers()
      setSelectedUser(null)
    } catch (err: any) {
      setMessage({ type: "error", text: "Permanent delete error: " + err.message })
    }
    setActionLoading(null)
  }

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Send password reset email to this user?")) return
    
    setActionLoading(userId)
    try {
      // Get email first
      const userDoc = await getDoc(doc(db, "users", userId))
      const email = userDoc.exists() ? userDoc.data()?.email : (await getDoc(doc(db, "profiles", userId))).data()?.email
      
      if (!email) throw new Error("User email not found")

      const { sendPasswordResetEmail } = await import("firebase/auth")
      await sendPasswordResetEmail(auth, email)
      
      setMessage({ type: "success", text: "Password reset email sent to " + email })
    } catch (err: any) {
      setMessage({ type: "error", text: "Reset error: " + err.message })
    }
    setActionLoading(null)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  const getDaysRemaining = (restoreBefore: number) => {
    const days = Math.ceil((restoreBefore - Date.now()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const calculateProgress = (progress: any) => {
    if (!progress) return 0
    const courses = Object.values(progress) as any[]
    if (courses.length === 0) return 0
    const total = courses.reduce((sum: number, c: any) => sum + (c.progress || 0), 0)
    return Math.round(total / courses.length)
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: "#0f0f0f", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <div style={{ color: "#fff", fontSize: "18px" }}>Loading admin panel...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", padding: "20px" }}>
      <style jsx global>{`
        .admin-header {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 20px 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          border: 1px solid #00d4ff;
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
        }
        .admin-title {
          color: #00d4ff;
          font-size: 28px;
          font-weight: bold;
          margin: 0;
        }
        .admin-subtitle {
          color: #888;
          margin-top: 5px;
        }
        .tab-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .tab-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }
        .tab-btn.active {
          background: #00d4ff;
          color: #000;
        }
        .tab-btn:not(.active) {
          background: #1a1a2e;
          color: #888;
        }
        .user-card {
          background: #1a1a2e;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 15px;
          border: 1px solid #333;
          transition: all 0.3s;
        }
        .user-card:hover {
          border-color: #00d4ff;
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.1);
        }
        .user-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .user-details h3 {
          color: #fff;
          margin: 0 0 5px 0;
          font-size: 18px;
        }
        .user-details p {
          color: #888;
          margin: 0;
          font-size: 14px;
        }
        .progress-bar {
          height: 8px;
          background: #333;
          border-radius: 4px;
          margin-top: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00d4ff, #00ff88);
          border-radius: 4px;
          transition: width 0.3s;
        }
        .action-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          margin-left: 8px;
          transition: all 0.3s;
        }
        .btn-view {
          background: #3b82f6;
          color: #fff;
        }
        .btn-delete {
          background: #ef4444;
          color: #fff;
        }
        .btn-restore {
          background: #22c55e;
          color: #fff;
        }
        .btn-permanent {
          background: #dc2626;
          color: #fff;
        }
        .btn-reset {
          background: #f59e0b;
          color: #000;
        }
        .action-btn:hover {
          opacity: 0.8;
          transform: translateY(-2px);
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #1a1a2e;
          border-radius: 16px;
          padding: 30px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid #00d4ff;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #333;
        }
        .modal-title {
          color: #00d4ff;
          font-size: 24px;
          margin: 0;
        }
        .close-btn {
          background: none;
          border: none;
          color: #888;
          font-size: 24px;
          cursor: pointer;
        }
        .detail-section {
          margin-bottom: 25px;
        }
        .detail-section h4 {
          color: #fff;
          margin: 0 0 15px 0;
          font-size: 16px;
          border-bottom: 1px solid #333;
          padding-bottom: 8px;
        }
        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }
        .detail-item {
          background: #0f0f0f;
          padding: 15px;
          border-radius: 8px;
        }
        .detail-label {
          color: #888;
          font-size: 12px;
          margin-bottom: 5px;
        }
        .detail-value {
          color: #fff;
          font-size: 16px;
          font-weight: 600;
        }
        .message {
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 600;
        }
        .message.success {
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid #22c55e;
          color: #22c55e;
        }
        .message.error {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid #ef4444;
          color: #ef4444;
        }
        .empty-state {
          text-align: center;
          padding: 50px;
          color: #888;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 10px;
        }
        .badge-deleted {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
      `}</style>

      {/* Header */}
      <div className="admin-header">
        <h1 className="admin-title">🔧 Admin Dashboard</h1>
        <p className="admin-subtitle">Manage users, view progress, and control accounts</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="tab-buttons">
        <button 
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Active Users ({users.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === "deleted" ? "active" : ""}`}
          onClick={() => setActiveTab("deleted")}
        >
          Deleted Users ({deletedUsers.length})
        </button>
      </div>

      {/* Users List */}
      {activeTab === "users" && (
        <div>
          {users.length === 0 ? (
            <div className="empty-state">
              <p>No active users found</p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.uid} className="user-card">
                <div className="user-info">
                  <div className="user-details">
                    <h3>
                      {user.username}
                      {user.deleted && <span className="badge badge-deleted">Deleted</span>}
                    </h3>
                    <p>{user.email}</p>
                    <p>Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${calculateProgress(user.progress)}%` }}
                      />
                    </div>
                    <p style={{ marginTop: "5px", fontSize: "12px" }}>
                      Overall Progress: {calculateProgress(user.progress)}%
                    </p>
                  </div>
                  <div>
                    <button 
                      className="action-btn btn-view"
                      onClick={() => handleViewDetails(user.uid)}
                      disabled={actionLoading === user.uid}
                    >
                      View Details
                    </button>
                    <button 
                      className="action-btn btn-reset"
                      onClick={() => handleResetPassword(user.uid)}
                      disabled={actionLoading === user.uid}
                    >
                      Reset Password
                    </button>
                    <button 
                      className="action-btn btn-delete"
                      onClick={() => handleDeleteUser(user.uid)}
                      disabled={actionLoading === user.uid}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Deleted Users */}
      {activeTab === "deleted" && (
        <div>
          {deletedUsers.length === 0 ? (
            <div className="empty-state">
              <p>No deleted users</p>
            </div>
          ) : (
            deletedUsers.map((user) => (
              <div key={user.uid} className="user-card" style={{ borderColor: "#ef4444" }}>
                <div className="user-info">
                  <div className="user-details">
                    <h3>{user.username}</h3>
                    <p>{user.email}</p>
                    <p>Deleted: {user.deletedAt ? formatDate(user.deletedAt) : "N/A"}</p>
                    <p style={{ color: "#ef4444" }}>
                      Restore before: {user.restoreBefore ? formatDate(user.restoreBefore) : "N/A"} ({user.restoreBefore ? getDaysRemaining(user.restoreBefore) : 0} days left)
                    </p>
                  </div>
                  <div>
                    <button 
                      className="action-btn btn-restore"
                      onClick={() => handleRestoreUser(user.uid)}
                      disabled={actionLoading === user.uid}
                    >
                      Restore
                    </button>
                    <button 
                      className="action-btn btn-permanent"
                      onClick={() => handlePermanentDelete(user.uid)}
                      disabled={actionLoading === user.uid}
                    >
                      Delete Forever
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">User Details</h2>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
            </div>

            <div className="detail-section">
              <h4>Profile Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Username</div>
                  <div className="detail-value">{selectedUser.username}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Email</div>
                  <div className="detail-value">{selectedUser.email}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Role</div>
                  <div className="detail-value">{selectedUser.role}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Joined</div>
                  <div className="detail-value">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Course Progress</h4>
              <div className="detail-grid">
                {selectedUser.progress && Object.entries(selectedUser.progress).map(([courseId, data]: [string, any]) => (
                  <div key={courseId} className="detail-item">
                    <div className="detail-label">{courseId}</div>
                    <div className="detail-value">
                      {data.progress || 0}% 
                      <span style={{ color: "#888", fontSize: "12px", marginLeft: "10px" }}>
                        ({data.completedVideos || 0}/{data.totalVideos || 0} videos)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h4>Overall Progress</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Total Progress</div>
                  <div className="detail-value">{selectedUser.overall?.overallProgress || 0}%</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Completed Videos</div>
                  <div className="detail-value">{selectedUser.overall?.completedVideos || 0}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Total Videos</div>
                  <div className="detail-value">{selectedUser.overall?.totalVideos || 0}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Completed Courses</div>
                  <div className="detail-value">{selectedUser.overall?.completedCourses || 0}</div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Quiz Attempts ({selectedUser.quizAttempts?.length || 0})</h4>
              {selectedUser.quizAttempts && selectedUser.quizAttempts.length > 0 ? (
                <div className="detail-grid">
                  {selectedUser.quizAttempts.slice(0, 5).map((quiz: any, index: number) => (
                    <div key={index} className="detail-item">
                      <div className="detail-label">{quiz.course_name || quiz.course_id}</div>
                      <div className="detail-value">
                        {quiz.mcq_score || 0}/{quiz.total_marks || 0} marks
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#888" }}>No quiz attempts</p>
              )}
            </div>

            <div className="detail-section">
              <h4>Focus Analytics ({selectedUser.focusAnalytics?.length || 0} sessions)</h4>
              {selectedUser.focusAnalytics && selectedUser.focusAnalytics.length > 0 ? (
                <div className="detail-grid">
                  {selectedUser.focusAnalytics.slice(0, 3).map((analytics: any, index: number) => (
                    <div key={index} className="detail-item">
                      <div className="detail-label">Session {index + 1}</div>
                      <div className="detail-value">
                        Attention: {analytics.attention_score || 0}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#888" }}>No focus analytics data</p>
              )}
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button 
                className="action-btn btn-reset"
                onClick={() => handleResetPassword(selectedUser.uid)}
              >
                Reset Password
              </button>
              <button 
                className="action-btn btn-delete"
                onClick={() => handleDeleteUser(selectedUser.uid)}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
