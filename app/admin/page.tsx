"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, query, where } from "firebase/firestore"
import { ref, get, remove } from "firebase/database"
import { auth, db, realtimeDb } from "../../lib/firebase"
import { softDeleteUser, restoreUser, permanentDeleteUser, resetUserPassword, getDeletedUsers, listAllUsersAdmin } from "../../app/actions/admin"

const ADMIN_EMAIL = "admin@123.in"

interface User {
  uid: string
  email: string
  username: string
  role: string
  createdAt: string
  lastLogin?: string
  deleted?: boolean
  deletedAt?: number | null
  restoreBefore?: number | null
  progress?: any
  deletionRequested?: boolean
  deletionRequestedAt?: string
}

interface UserDetails {
  uid: string
  email: string
  username: string
  role: string
  createdAt: string
  progress?: any
  overall?: any
  quizAttempts?: any[]
  focusAnalytics?: any[]
  deletionRequested?: boolean
  deletionRequestedAt?: string
  [key: string]: any
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null)
  const [activeTab, setActiveTab] = useState<"users" | "requests">("users")
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
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const loadUsers = async () => {
    try {
      const result = await listAllUsersAdmin()
      if (result.success && result.users) {
        setUsers(result.users)
      } else {
        setMessage({ type: "error", text: result.error || "Failed to load users" })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Exception loading users: " + err.message })
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
            createdAt: pData.created_at,
            deletionRequested: pData.deletionRequested,
            deletionRequestedAt: pData.deletionRequestedAt
          }
        }
      }

      if (!userData) {
        setMessage({ type: "error", text: "User profile not found in database" })
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
    if (!confirm("Are you sure you want to delete this user? They will be permanently removed from Database AND Authentication list.")) return
    
    setActionLoading(userId)
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, adminEmail: ADMIN_EMAIL }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: "success", text: "User permanently deleted" })
        await loadUsers()
        setSelectedUser(null)
      } else {
        throw new Error(result.error || "Failed to delete user");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Delete error: " + err.message })
    }
    setActionLoading(null)
  }

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Send password reset email to this user?")) return
    
    setActionLoading(userId)
    try {
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

  const handleClearRequest = async (userId: string) => {
    if (!confirm("Clear this deletion request? The user will remain active.")) return
    
    setActionLoading(userId)
    try {
      await updateDoc(doc(db, "profiles", userId), {
        deletionRequested: false,
        deletionRequestedAt: null
      })
      
      setMessage({ type: "success", text: "Deletion request cleared" })
      await loadUsers()
    } catch (err: any) {
      setMessage({ type: "error", text: "Error clearing request: " + err.message })
    }
    setActionLoading(null)
  }

  const calculateProgress = (progress: any) => {
    if (!progress) return 0
    const courses = Object.values(progress) as any[]
    if (courses.length === 0) return 0
    const total = courses.reduce((sum: number, c: any) => sum + (c.progress || 0), 0)
    return Math.round(total / courses.length)
  }

  const requests = users.filter(u => u.deletionRequested)

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#fff", fontSize: "18px" }}>Loading admin panel...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", padding: "20px" }}>
      <style jsx global>{`
        .admin-header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 20px 30px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #00d4ff; box-shadow: 0 0 20px rgba(0, 212, 255, 0.2); }
        .admin-title { color: #00d4ff; font-size: 28px; font-weight: bold; margin: 0; }
        .admin-subtitle { color: #888; margin-top: 5px; }
        .tab-buttons { display: flex; gap: 10px; margin-bottom: 20px; }
        .tab-btn { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s; }
        .tab-btn.active { background: #00d4ff; color: #000; }
        .tab-btn:not(.active) { background: #1a1a2e; color: #888; }
        .user-card { background: #1a1a2e; border-radius: 12px; padding: 20px; margin-bottom: 15px; border: 1px solid #333; transition: all 0.3s; }
        .user-card:hover { border-color: #00d4ff; box-shadow: 0 0 15px rgba(0, 212, 255, 0.1); }
        .user-info { display: flex; justify-content: space-between; align-items: center; }
        .user-details h3 { color: #fff; margin: 0 0 5px 0; font-size: 18px; }
        .user-details p { color: #888; margin: 0; font-size: 14px; }
        .progress-bar { height: 8px; background: #333; border-radius: 4px; margin-top: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #00d4ff, #00ff88); border-radius: 4px; transition: width 0.3s; }
        .action-btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; margin-left: 8px; transition: all 0.3s; }
        .btn-view { background: #3b82f6; color: #fff; }
        .btn-delete { background: #ef4444; color: #fff; }
        .btn-reset { background: #f59e0b; color: #000; }
        .action-btn:hover { opacity: 0.8; transform: translateY(-2px); }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #1a1a2e; border-radius: 16px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; border: 1px solid #00d4ff; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #333; }
        .modal-title { color: #00d4ff; font-size: 24px; margin: 0; }
        .close-btn { background: none; border: none; color: #888; font-size: 24px; cursor: pointer; }
        .detail-section { margin-bottom: 25px; }
        .detail-section h4 { color: #fff; margin: 0 0 15px 0; font-size: 16px; border-bottom: 1px solid #333; padding-bottom: 8px; }
        .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .detail-item { background: #0f0f0f; padding: 15px; border-radius: 8px; }
        .detail-label { color: #888; font-size: 12px; margin-bottom: 5px; }
        .detail-value { color: #fff; font-size: 16px; font-weight: 600; }
        .message { padding: 15px; border-radius: 8px; margin-bottom: 20px; font-weight: 600; }
        .message.success { background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #22c55e; }
        .message.error { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #ef4444; }
        .empty-state { text-align: center; padding: 50px; color: #888; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 10px; }
        .badge-request { background: rgba(234, 179, 8, 0.2); color: #eab308; border: 1px solid #eab308; }
      `}</style>

      <div className="admin-header">
        <h1 className="admin-title">🔧 Admin Dashboard</h1>
        <p className="admin-subtitle">Manage users, view progress, and control accounts</p>
      </div>

      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      <div className="tab-buttons" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>Active Users ({users.length})</button>
          <button className={`tab-btn ${activeTab === "requests" ? "active" : ""}`} onClick={() => setActiveTab("requests")}>Requests ({requests.length})</button>
        </div>
        
        {activeTab === "users" && (
          <button className="action-btn btn-view" onClick={() => { setLoading(true); loadUsers().then(() => setLoading(false)); }} style={{ margin: 0 }}>Refresh List</button>
        )}
      </div>

      {activeTab === "users" && (
        <div>
          {users.length === 0 ? <div className="empty-state"><p>No active users found</p></div> : (
            users.map((user) => (
              <div key={user.uid} className="user-card">
                <div className="user-info">
                  <div className="user-details">
                    <h3>{user.username} {user.deletionRequested && <span className="badge badge-request">Deletion Requested</span>}</h3>
                    <p>{user.email}</p>
                    <p>Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${calculateProgress(user.progress)}%` }} /></div>
                    <p style={{ marginTop: "5px", fontSize: "12px" }}>Overall Progress: {calculateProgress(user.progress)}%</p>
                  </div>
                  <div><button className="action-btn btn-view" onClick={() => handleViewDetails(user.uid)} disabled={actionLoading === user.uid}>View Details</button></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div>
          {requests.length === 0 ? <div className="empty-state"><p>No deletion requests</p></div> : (
            requests.map((user) => (
              <div key={user.uid} className="user-card" style={{ borderColor: "#eab308" }}>
                <div className="user-info">
                  <div className="user-details">
                    <h3>{user.username}</h3>
                    <p>{user.email}</p>
                    <p style={{ color: "#eab308" }}>Requested: {user.deletionRequestedAt ? new Date(user.deletionRequestedAt).toLocaleDateString() : "Unknown"}</p>
                  </div>
                  <div>
                    <button className="action-btn btn-view" onClick={() => handleViewDetails(user.uid)} disabled={actionLoading === user.uid}>Review Request</button>
                    <button className="action-btn btn-reset" onClick={() => handleClearRequest(user.uid)} disabled={actionLoading === user.uid} style={{ background: '#22c55e', color: '#fff' }}>Done</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">User Details {selectedUser.deletionRequested && <span className="badge badge-request" style={{marginLeft: '10px'}}>Deletion Requested</span>}</h2>
              <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div className="detail-section">
              <h4>Profile Information</h4>
              <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Username</div><div className="detail-value">{selectedUser.username}</div></div>
                <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">{selectedUser.email}</div></div>
                <div className="detail-item"><div className="detail-label">Role</div><div className="detail-value">{selectedUser.role}</div></div>
                <div className="detail-item"><div className="detail-label">Joined</div><div className="detail-value">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}</div></div>
              </div>
            </div>
            {/* Course Progress Section */}
            <div className="detail-section">
              <h4>Course Progress</h4>
              <div className="detail-grid">
                {selectedUser.progress && Object.entries(selectedUser.progress).map(([courseId, data]: [string, any]) => (
                  <div key={courseId} className="detail-item">
                    <div className="detail-label">{courseId}</div>
                    <div className="detail-value">{data.progress || 0}% <span style={{ color: "#888", fontSize: "12px", marginLeft: "10px" }}>({data.completedVideos || 0}/{data.totalVideos || 0} videos)</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button className="action-btn btn-reset" onClick={() => handleResetPassword(selectedUser.uid)}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
