import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test credentials - replace with your actual credentials for testing
    const testUserId = 'YOUR_USER_ID';
    const testApiKey = 'YOUR_API_KEY';
    
    if (testUserId === 'YOUR_USER_ID' || testApiKey === 'YOUR_API_KEY') {
      return NextResponse.json({
        error: 'No test credentials configured',
        message: 'Add your Acuity credentials to test the API',
        note: 'This endpoint is for testing only'
      });
    }

    const auth = Buffer.from(`${testUserId}:${testApiKey}`).toString('base64');
    
    // Test the basic /me endpoint first
    const response = await fetch('https://acuityscheduling.com/api/v1/me', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: `Acuity API error: ${response.status} ${response.statusText}`,
        details: errorText,
        testUrl: 'https://acuityscheduling.com/api/v1/me'
      }, { status: response.status });
    }

    const userData = await response.json();

    // Now test getting appointments
    const appointmentsResponse = await fetch('https://acuityscheduling.com/api/v1/appointments?max=5', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    let appointmentsData = null;
    if (appointmentsResponse.ok) {
      appointmentsData = await appointmentsResponse.json();
    }

    return NextResponse.json({
      success: true,
      userInfo: userData,
      appointments: appointmentsData,
      testEndpoints: {
        userInfo: 'https://acuityscheduling.com/api/v1/me',
        appointments: 'https://acuityscheduling.com/api/v1/appointments?max=5'
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      details: error.message,
      note: 'This endpoint tests direct Acuity API calls'
    }, { status: 500 });
  }
} 