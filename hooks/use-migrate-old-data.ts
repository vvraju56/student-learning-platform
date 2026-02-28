"use client"

import { useEffect, useState } from "react"
import { dataMigrationService } from "@/services/data-migration-service"

const COURSE_IDS = ["web-development", "app-development", "game-development"]
const COURSE_NAMES: { [key: string]: string } = {
  "web-development": "Web Development",
  "app-development": "App Development",
  "game-development": "Game Development"
}

export function useMigrateOldData(userId: string) {
  const [migrationStatus, setMigrationStatus] = useState<{
    status: "idle" | "migrating" | "completed" | "error"
    message: string
  }>({
    status: "idle",
    message: ""
  })

  useEffect(() => {
    if (!userId) return

    const performMigration = async () => {
      try {
        // Check if migration is needed
        if (!dataMigrationService.isMigrationNeeded(userId)) {
          setMigrationStatus({
            status: "idle",
            message: "No legacy data to migrate"
          })
          return
        }

        setMigrationStatus({
          status: "migrating",
          message: "Migrating your learning progress..."
        })

        // Get old data from localStorage
        const oldData = dataMigrationService.getOldLocalStorageData(COURSE_IDS)

        if (Object.keys(oldData).length === 0) {
          setMigrationStatus({
            status: "idle",
            message: "No data found to migrate"
          })
          return
        }

        // Call migration API
        const response = await fetch("/api/migrate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userId,
            courseProgressMap: oldData
          })
        })

        if (!response.ok) {
          throw new Error(`Migration API error: ${response.statusText}`)
        }

        const result = await response.json()

        if (result.success) {
          setMigrationStatus({
            status: "completed",
            message: `✅ Successfully migrated ${result.data.completedVideos}/${result.data.totalVideos} videos from ${result.data.migratedCourses} courses`
          })

          // Clear old localStorage data
          dataMigrationService.clearOldLocalStorageData(COURSE_IDS)

          // Reload analytics
          window.location.reload()
        } else {
          throw new Error(result.error || "Migration failed")
        }
      } catch (error) {
        console.error("Migration error:", error)
        setMigrationStatus({
          status: "error",
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        })
      }
    }

    // Run migration on mount
    performMigration()
  }, [userId])

  return migrationStatus
}
