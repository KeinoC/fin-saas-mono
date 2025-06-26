import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from 'database';
import { supabase } from 'config';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const dataImport = await DatabaseService.getDataImport(id);
    
    if (!dataImport) {
      return NextResponse.json(
        { success: false, error: 'Data import not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dataImport,
    });

  } catch (error) {
    console.error('Get import error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update file name
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: importId } = await params;
    const { filename } = await request.json();

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid filename' },
        { status: 400 }
      );
    }

    let updated = false;

    // Try to update in database first
    const DatabaseService = await getDatabaseService();
    if (DatabaseService) {
      try {
        const updatedImport = await DatabaseService.updateDataImport(importId, {
          filename: filename.trim()
        });
        if (updatedImport) {
          updated = true;
          console.log('Updated filename in database:', importId);
        }
      } catch (error) {
        console.warn('Database update failed:', error);
      }
    }

    // Update in memory storage as fallback
    if (!updated) {
      const inMemoryImports = getInMemoryStorage();
      let found = false;
      
      for (const [orgId, imports] of inMemoryImports.entries()) {
        const importIndex = imports.findIndex(imp => imp.id === importId);
        if (importIndex !== -1) {
          imports[importIndex].filename = filename.trim();
          inMemoryImports.set(orgId, imports);
          found = true;
          console.log('Updated filename in memory:', importId);
          break;
        }
      }

      if (!found) {
        return NextResponse.json(
          { success: false, error: 'Import not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Filename updated successfully'
    });

  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update filename' },
      { status: 500 }
    );
  }
}

// DELETE - Remove import
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: importId } = await params;

    let deleted = false;

    // Try to delete from database first
    const DatabaseService = await getDatabaseService();
    if (DatabaseService) {
      try {
        await DatabaseService.deleteDataImport(importId);
        deleted = true;
        console.log('Deleted import from database:', importId);
      } catch (error) {
        console.warn('Database deletion failed:', error);
      }
    }

    // Delete from memory storage as fallback
    if (!deleted) {
      const inMemoryImports = getInMemoryStorage();
      let found = false;
      
      for (const [orgId, imports] of inMemoryImports.entries()) {
        const importIndex = imports.findIndex(imp => imp.id === importId);
        if (importIndex !== -1) {
          imports.splice(importIndex, 1);
          inMemoryImports.set(orgId, imports);
          found = true;
          console.log('Deleted import from memory:', importId);
          break;
        }
      }

      if (!found) {
        return NextResponse.json(
          { success: false, error: 'Import not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Import deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete import' },
      { status: 500 }
    );
  }
} 