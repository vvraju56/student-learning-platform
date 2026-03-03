import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminRealtime } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // 1. Check if Admin SDK initialized correctly
    if (!adminAuth || !adminDb || !adminRealtime) {
      return NextResponse.json({ 
        error: "Firebase Admin SDK not initialized. Check server logs for ASN.1 or key errors." 
      }, { status: 500 });
    }

    const { userId, adminEmail } = await request.json();

    // 2. Security check
    if (adminEmail !== "admin@123.in") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 3. Delete from Firebase Authentication
    try {
      await adminAuth.deleteUser(userId);
    } catch (authError: any) {
      console.error('Auth deletion skip (might already be gone):', authError.message);
    }

    // 4. Delete Firestore records
    await adminDb.collection('users').doc(userId).delete();
    await adminDb.collection('profiles').doc(userId).delete();

    // 5. Delete related collections
    const collections = ["video_progress", "quiz_attempts", "focus_analytics"];
    for (const colName of collections) {
      const snapshot = await adminDb.collection(colName).where('user_id', '==', userId).get();
      const batch = adminDb.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // 6. Delete from Realtime Database
    await adminRealtime.ref(`users/${userId}`).remove();

    return NextResponse.json({ success: true, message: "User completely removed" });
  } catch (error: any) {
    console.error('Permanent delete API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
