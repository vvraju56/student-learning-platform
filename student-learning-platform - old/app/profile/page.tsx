"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Video, Award, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"

async function getUserProfile(uid: string) {
  const profileDoc = await getDoc(doc(db, "profiles", uid))
  return profileDoc.exists() ? profileDoc.data() : null
}

async function getUserData(uid: string) {
  const videoProgressQuery = query(collection(db, "video_progress"), where("user_id", "==", uid))
  const videoProgressSnapshot = await getDocs(videoProgressQuery)
  const videoProgress = videoProgressSnapshot.docs.map(doc => doc.data())

  const quizAttemptsQuery = query(
    collection(db, "quiz_attempts"), 
    where("user_id", "==", uid)
  )
  const quizAttemptsSnapshot = await getDocs(quizAttemptsQuery)
  const quizAttempts = quizAttemptsSnapshot.docs.map(doc => doc.data()).sort((a, b) => b.created_at - a.created_at)

  const focusAnalyticsQuery = query(collection(db, "focus_analytics"), where("user_id", "==", uid))
  const focusAnalyticsSnapshot = await getDocs(focusAnalyticsQuery)
  const focusAnalytics = focusAnalyticsSnapshot.docs.map(doc => doc.data())

  return { videoProgress, quizAttempts, focusAnalytics }
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [videoProgress, setVideoProgress] = useState<any[]>([])
  const [quizAttempts, setQuizAttempts] = useState<any[]>([])
  const [focusAnalytics, setFocusAnalytics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login")
        return
      }

      setUser(currentUser)
      const userProfile = await getUserProfile(currentUser.uid)
      const { videoProgress: progress, quizAttempts: attempts, focusAnalytics: analytics } = await getUserData(currentUser.uid)
      
      setProfile(userProfile)
      setVideoProgress(progress)
      setQuizAttempts(attempts)
      setFocusAnalytics(analytics)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const totalVideosWatched = videoProgress?.filter((v) => v.completed).length || 0
  const totalQuizzesPassed = quizAttempts?.filter((q) => q.passed).length || 0
  const averageQuizScore =
    quizAttempts && quizAttempts.length > 0
      ? Math.round(quizAttempts.reduce((acc, q) => acc + q.total_score, 0) / quizAttempts.length)
      : 0

  const averageFocusScore =
    focusAnalytics && focusAnalytics.length > 0
      ? Math.round(focusAnalytics.reduce((acc, f) => acc + (f.attention_score || 0), 0) / focusAnalytics.length)
      : 0

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-semibold">{profile?.username || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{profile?.email || user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-semibold">{new Date(profile?.created_at || user?.metadata?.creationTime).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Study Streak</p>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {profile?.study_streak || 0} days
                  </Badge>
                  <Calendar className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Video className="h-8 w-8 text-blue-500" />
                    <p className="text-2xl font-bold">{totalVideosWatched}</p>
                    <p className="text-xs text-muted-foreground">Videos Watched</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Award className="h-8 w-8 text-green-500" />
                    <p className="text-2xl font-bold">{totalQuizzesPassed}</p>
                    <p className="text-xs text-muted-foreground">Quizzes Passed</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                    <p className="text-2xl font-bold">{averageQuizScore}%</p>
                    <p className="text-xs text-muted-foreground">Avg Quiz Score</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                    <p className="text-2xl font-bold">{averageFocusScore}%</p>
                    <p className="text-xs text-muted-foreground">Avg Focus Score</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Quiz Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                {quizAttempts && quizAttempts.length > 0 ? (
                  <div className="space-y-3">
                    {quizAttempts.slice(0, 5).map((attempt) => (
                      <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Module {attempt.module_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(attempt.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={attempt.passed ? "default" : "destructive"}>{attempt.total_score}%</Badge>
                          {attempt.passed ? (
                            <Award className="h-5 w-5 text-green-500" />
                          ) : (
                            <span className="text-xs text-red-500">Failed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6">No quiz attempts yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
