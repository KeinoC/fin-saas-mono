import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

async function getDatabaseService() {
  try {
    const { prisma } = await import('database/lib/client');
    return prisma;
  } catch (error) {
    console.warn('Database service not available:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      orgId, 
      data, 
      metadata,
      name,
      description 
    } = body;

    if (!orgId || !data || !Array.isArray(data)) {
      return NextResponse.json({ 
        error: 'Missing required fields: orgId, data' 
      }, { status: 400 });
    }

    const prisma = await getDatabaseService();
    if (!prisma) {
      return NextResponse.json({ 
        error: 'Database service not available' 
      }, { status: 500 });
    }

    // Create a data import record
    const dataImport = await prisma.dataImport.create({
      data: {
        orgId,
        fileType: 'csv', // Required field - using 'csv' as default for API data
        data: data,
        metadata: {
          ...metadata,
          name: name || `Data Import - ${new Date().toLocaleDateString()}`,
          description: description || `Retrieved from ${metadata?.source || 'unknown source'}`,
          source: metadata?.source || 'manual',
          dataType: metadata?.dataType || 'unknown',
          status: 'processed',
          recordCount: data.length,
          importedAt: new Date().toISOString(),
        },
        createdBy: session.user.id,
      }
    });

    console.log(`Saved data import: ${dataImport.id} with ${data.length} records`);

    return NextResponse.json({
      success: true,
      importId: dataImport.id,
      recordsSaved: data.length,
      message: 'Data saved successfully'
    });

  } catch (error: any) {
    console.error('Save data error:', error);
    return NextResponse.json({
      error: 'Failed to save data',
      details: error.message
    }, { status: 500 });
  }
} 