import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, username, password, mobileNumber } = await request.json();

    if (!email || !username || !password || !mobileNumber) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Registration failed' }, { status: 400 });
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: user.id, username, mobile_number: mobileNumber }]);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
