"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../lib/firebase"
import { getAllUsers, getUserDetails, softDeleteUser, restoreUser, permanentDeleteUser, resetUserPassword, getDeletedUsers } from "../../app/actions/admin"

const ADMIN_EMAIL = "admin123.in"

interface User {
  uid: string
  email: string
  username: string
  role: string
  createdAt: string
  deleted: boolean
  deletedAt: number | null
  restoreBefore: number | null
  progress?: any
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
  [key: string]: any
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
        router.push("/login")
        return
      }

      // Check if admin
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
    const result = await getAllUsers()
    if (result.success && result.users) {
      setUsers(result.users)
    }
  }

  const loadDeletedUsers = async () => {
    const result = await getDeletedUsers()
    if (result.success && result.deletedUsers) {
      setDeletedUsers(result.deletedUsers)
    }
  }

  const handleViewDetails = async (userId: string) => {
    setActionLoading(userId)
    const result = await getUserDetails(userId)
    if (result.success && result.user) {
      setSelectedUser(result.user)
    } else {
      setMessage({ type: "error", text: result.error || "Failed to load user details" })
    }
    setActionLoading(null)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? They can be restored within 7 days.")) return
    
    setActionLoading(userId)
    const result = await softDeleteUser(userId)
    
    if (result.success) {
      setMessage({ type: "success", text: result.message || "Success" })
      await loadUsers()
      await loadDeletedUsers()
    } else {
      setMessage({ type: "error", text: result.error || "An error occurred" })
    }
    setActionLoading(null)
  }

  const handleRestoreUser = async (userId: string) => {
    if (!confirm("Restore this user? Their data will be restored.")) return
    
    setActionLoading(userId)
    const result = await restoreUser(userId)
    
    if (result.success) {
      setMessage({ type: "success", text: result.message || "Success" })
      await loadUsers()
      await loadDeletedUsers()
    } else {
      setMessage({ type: "error", text: result.error || "An error occurred" })
    }
    setActionLoading(null)
  }

  const handlePermanentDelete = async (userId: string) => {
    if (!confirm("⚠️ PERMANENT DELETE! This cannot be undone. Are you sure?")) return
    
    setActionLoading(userId)
    const result = await permanentDeleteUser(userId)
    
    if (result.success) {
      setMessage({ type: "success", text: result.message || "User deleted" })
      await loadDeletedUsers()
      setSelectedUser(null)
    } else {
      setMessage({ type: "error", text: result.error || "Failed to delete user" })
    }
    setActionLoading(null)
  }

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Reset password to default 'student'?")) return
    
    setActionLoading(userId)
    const result = await resetUserPassword(userId)
    
    if (result.success) {
      setMessage({ type: "success", text: result.message || "Password reset" })
    } else {
      setMessage({ type: "error", text: result.error || "Failed to reset password" })
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
