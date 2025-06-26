import { authLocal } from '@lib/auth-local';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    
    // Create user using better-auth
    const result = await authLocal.api.signUpEmail({
      body: {
        email,
        password,
        name: name || 'Test User',
      },
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: result.data?.user?.id,
        email: result.data?.user?.email,
        name: result.data?.user?.name,
      },
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
} 