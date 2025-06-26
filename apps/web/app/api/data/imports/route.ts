import { NextRequest, NextResponse } from 'next/server';

// Extend global type for development persistence
declare global {
  var inMemoryImports: Map<string, any[]> | undefined;
}

// Helper function to safely import Database
async function getDatabaseService() {
  try {
    const { DatabaseService } = await import('database');
    return DatabaseService;
  } catch (error) {
    console.warn('Database not available:', error);
    return null;
  }
}

// Helper function to get persistent in-memory storage
function getInMemoryStorage() {
  if (!globalThis.inMemoryImports) {
    globalThis.inMemoryImports = new Map();
  }
  return globalThis.inMemoryImports as Map<string, any[]>;
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

    // Try to get from database first
    const DatabaseService = await getDatabaseService();
    
    if (DatabaseService) {
      try {
        const imports = await DatabaseService.getDataImports(orgId);
        return NextResponse.json(imports);
      } catch (dbError) {
        console.warn('Database operation failed:', dbError);
        // Fall through to in-memory storage
      }
    }
    
    // Try to get from in-memory storage
    const inMemoryImports = getInMemoryStorage();
    if (inMemoryImports) {
      const orgImports = inMemoryImports.get(orgId) || [];
      return NextResponse.json(orgImports);
    }
    
    // Return empty array if both fail
    return NextResponse.json([]);

  } catch (error) {
    console.error('Fetch imports error:', error);
    return NextResponse.json([]);
  }
} 