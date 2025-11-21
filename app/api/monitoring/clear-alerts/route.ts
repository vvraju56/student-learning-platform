import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Simplified for preview mode - no Firebase Admin dependency
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(' Clear alerts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear alerts' },
      { status: 500 }
    );
  }
}
