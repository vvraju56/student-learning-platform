import { NextRequest, NextResponse } from "next/server"
import { dataMigrationService, OldCourseProgress } from "@/services/data-migration-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, courseProgressMap } = body

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      )
    }

    if (!courseProgressMap) {
      return NextResponse.json(
        { error: "Missing courseProgressMap" },
        { status: 400 }
      )
    }

    // Perform migration
    const result = await dataMigrationService.migrateOldData(
      userId,
      courseProgressMap as { [courseId: string]: OldCourseProgress }
    )

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: `Successfully migrated ${result.migratedCourses} courses with ${result.completedVideos}/${result.totalVideos} completed videos`,
          data: result
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: "Migration failed", data: result },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
