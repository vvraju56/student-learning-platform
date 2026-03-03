import { NextRequest, NextResponse } from 'next/server';
import { db, realtimeDb } from '@/lib/firebase';
import { doc, deleteDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { ref, remove } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const { userId, adminEmail } = await request.json();

    if (adminEmail !== "admin@123.in") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if user exists
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    if (userData.email === "admin@123.in") {
      return NextResponse.json({ error: "Cannot delete admin user" }, { status: 400 });
    }

    // Delete Firestore user document
    await deleteDoc(doc(db, "users", userId));
    
    // Try to delete profiles collection
    try {
      await deleteDoc(doc(db, "profiles", userId));
    } catch (e) {
      console.log("No profiles doc to delete");
    }

    // Delete related collections
    const collections = ["video_progress", "quiz_attempts", "focus_analytics"];
    for (const colName of collections) {
      try {
        const q = query(collection(db, colName), where("user_id", "==", userId));
        const snapshot = await getDocs(q);
        for (const d of snapshot.docs) {
          await deleteDoc(d.ref);
        }
      } catch (e) {
        console.log(`No ${colName} to delete`);
      }
    }

    // Delete from Realtime Database
    try {
      await remove(ref(realtimeDb, `users/${userId}`));
    } catch (e) {
      console.log("No Realtime DB data to delete");
    }

    return NextResponse.json({ success: true, message: "User completely removed from database" });
  } catch (error: any) {
    console.error('Permanent delete API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
