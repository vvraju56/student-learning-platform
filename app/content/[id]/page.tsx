"use client"

import { dummyContent } from "@/data/content"
import { notFound } from "next/navigation"
import { redirect } from "next/navigation"
import { auth } from "@/lib/firebase"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, PlayCircle, AlertCircle, CheckCircle } from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ContentViewerPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login")
        return
      }
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const item = dummyContent.find((c) => c.id === params.id)

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  if (!item) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <Button size="sm" asChild>
            <Link href={`/content/${item.id}/quiz`}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Take Quiz
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardHeader>
                <Badge variant="secondary" className="w-fit mb-2">
                  {item.category}
                </Badge>
                <CardTitle className="text-3xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-blue max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Live Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="font-medium text-sm">Posture Status</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Good posture detected</p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <p className="font-medium text-sm">Attention Status</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Focused on content</p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-gray-600" />
                    <p className="font-medium text-sm">Tips</p>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                    <li>• Take breaks every 20 minutes</li>
                    <li>• Maintain proper posture</li>
                    <li>• Stay hydrated</li>
                  </ul>
                </div>

                <Button className="w-full" size="sm" asChild>
                  <Link href={`/content/${item.id}/quiz`}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Quiz
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
