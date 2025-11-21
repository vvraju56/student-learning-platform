import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          uid: `user_${email.replace(/[@.]/g, '_')}`,
          email,
          username: email.split('@')[0],
          mobileNumber: '',
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(' Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
