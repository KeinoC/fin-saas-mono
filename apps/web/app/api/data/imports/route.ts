import { NextRequest, NextResponse } from 'next/server';

async function getDatabaseService() {
  try {
    const { prisma } = await import('database/lib/client');
    return prisma;
  } catch (error) {
    console.warn('Database service not available:', error);
    return null;
  }
}

// Transform database records to match component expectations
function transformDataImport(dbImport: any) {
  const metadata = dbImport.metadata || {};
  
  // Extract data from the JSON field
  const dataArray = Array.isArray(dbImport.data) ? dbImport.data : [];
  
  // Get columns from first data record if available
  const columns = dataArray.length > 0 ? Object.keys(dataArray[0]) : [];
  
  // Generate a filename based on metadata or fallback
  const filename = metadata.name || 
    `${metadata.source || 'data'}_${metadata.dataType || 'import'}_${new Date(dbImport.createdAt).toLocaleDateString().replace(/\//g, '-')}.csv`;

  return {
    id: dbImport.id,
    filename: filename,
    status: 'completed', // All saved imports are considered completed
    rowCount: dataArray.length,
    fileSize: JSON.stringify(dbImport.data).length, // Rough estimate
    createdAt: dbImport.createdAt,
    uploadedBy: dbImport.createdBy || 'Unknown',
    columns: columns,
    preview: dataArray.slice(0, 3), // First 3 records for preview
    fileUrl: null, // API data doesn't have file URLs
    metadata: metadata
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'Missing orgId parameter' },
        { status: 400 }
      );
    }

    const prisma = await getDatabaseService();
    if (!prisma) {
      return NextResponse.json([]);
    }

    const imports = await prisma.dataImport.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data to match component expectations
    const transformedImports = imports.map(transformDataImport);

    return NextResponse.json(transformedImports);

  } catch (error) {
    console.error('Fetch imports error:', error);
    return NextResponse.json([]);
  }
} 