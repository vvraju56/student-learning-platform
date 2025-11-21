import { NextRequest, NextResponse } from 'next/server';

// For preview mode (no Firebase admin available)
// In production with proper Firebase credentials, this would use Firebase Admin SDK

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, mobileNumber } = await request.json();

    // Validate input
    if (!email || !username || !password || !mobileNumber) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          uid: `user_${Date.now()}`,
          email,
          username,
          mobileNumber,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(' Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
