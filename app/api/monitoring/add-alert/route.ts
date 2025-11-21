import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { uid, type, message, severity } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, id: `alert_${Date.now()}` },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(' Add alert error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add alert' },
      { status: 500 }
    );
  }
}
