import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Return alerts from context/localStorage
    return NextResponse.json(
      { success: true, alerts: [] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get alerts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get alerts' },
      { status: 500 }
    );
  }
}
