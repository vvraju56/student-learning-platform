"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, Bell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore"

type Alert = {
  id: number
  type: string
  message: string
  created_at: string
  resolved: boolean
}

export function RealtimeAlerts({ userId }: { userId: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  useEffect(() => {
    // Initial fetch
    const fetchAlerts = async () => {
      if (!auth.currentUser) return
      
      const alertsRef = collection(db, "alerts")
      const q = query(
        alertsRef,
        where("user_id", "==", userId),
        orderBy("created_at", "desc"),
        limit(20)
      )
      
      const querySnapshot = await getDocs(q)
      const alertsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[]
      
      setAlerts(alertsData)
    }

    fetchAlerts()

    // Realtime listener
    const alertsRef = collection(db, "alerts")
    const q = query(
      alertsRef,
      where("user_id", "==", userId),
      orderBy("created_at", "desc"),
      limit(20)
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[]
      setAlerts(alertsData.slice(0, 20))
    })

    return () => {
      unsubscribe()
    }
  }, [userId])

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Recent Alerts</CardTitle>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-8">No alerts yet. Good job!</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className={`mt-0.5 ${alert.type === "posture" ? "text-orange-500" : "text-red-500"}`}>
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
