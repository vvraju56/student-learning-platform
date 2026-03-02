import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminRealtime } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, adminEmail } = await request.json();

    // 1. Security check: Only the designated admin email can trigger this
    if (adminEmail !== "admin@123.in") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    console.log(`Starting permanent deletion for user: ${userId}`);

    // 2. Delete from Firebase Authentication (This is what you needed!)
    try {
      await adminAuth.deleteUser(userId);
      console.log('Successfully deleted user from Firebase Auth');
    } catch (authError: any) {
      console.error('Error deleting from Firebase Auth:', authError.message);
      // If user doesn't exist in Auth, we continue to clean up DB
    }

    // 3. Delete Firestore Profile and User records
    await adminDb.collection('users').doc(userId).delete();
    await adminDb.collection('profiles').doc(userId).delete();

    // 4. Delete Firestore related collections (progress, quizzes, etc.)
    const collections = ["video_progress", "quiz_attempts", "focus_analytics"];
    for (const colName of collections) {
      const snapshot = await adminDb.collection(colName).where('user_id', '==', userId).get();
      const batch = adminDb.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // 5. Delete from Realtime Database
    await adminRealtime.ref(`users/${userId}`).remove();

    return NextResponse.json({ success: true, message: "User permanently deleted from Auth and Database" });
  } catch (error: any) {
    console.error('Permanent delete API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
