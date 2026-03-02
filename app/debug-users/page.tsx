"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function DebugUsersPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkCollections = async () => {
      try {
        const results: any = {}
        const collections = ["profiles", "users", "video_progress", "quiz_attempts"]
        
        for (const colName of collections) {
          const snap = await getDocs(collection(db, colName))
          results[colName] = {
            count: snap.size,
            docs: snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          }
        }
        
        setData(results)
      } catch (err: any) {
        setData({ error: err.message })
      }
      setLoading(false)
    }

    checkCollections()
  }, [])

  if (loading) return <div className="p-8 text-white bg-black min-h-screen">Scanning Firestore...</div>

  return (
    <div className="p-8 text-white bg-black min-h-screen font-mono">
      <h1 className="text-2xl font-bold mb-6 text-cyan-400">Firestore Debug Info</h1>
      
      {data?.error ? (
        <div className="p-4 bg-red-900/20 border border-red-500 text-red-400 mb-4">
          Error: {data.error}
        </div>
      ) : (
        Object.entries(data || {}).map(([col, info]: [string, any]) => (
          <div key={col} className="mb-8 border border-gray-800 p-4 rounded">
            <h2 className="text-xl font-bold mb-2 text-yellow-400 uppercase">
              Collection: {col} ({info.count} docs)
            </h2>
            <div className="bg-gray-900 p-2 overflow-auto max-h-60">
              <pre className="text-xs">
                {JSON.stringify(info.docs, null, 2)}
              </pre>
            </div>
          </div>
        ))
      )}

      <div className="mt-8">
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-500 transition-colors"
        >
          Refresh Data
        </button>
      </div>
    </div>
  )
}
