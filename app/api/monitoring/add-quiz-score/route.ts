import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { uid, score } = await request.json();

    if (!uid || score === undefined) {
      return NextResponse.json(
        { error: 'User ID and score are required' },
        { status: 400 }
      );
    }

    // Simplified for preview mode - no Firebase Admin dependency
    return NextResponse.json(
      { success: true, id: `score_${Date.now()}` },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(' Add quiz score error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add quiz score' },
      { status: 500 }
    );
  }
}
