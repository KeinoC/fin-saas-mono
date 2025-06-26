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

// Function to convert data back to CSV format
function convertToCSV(data: any[], columns: string[]): string {
  if (!data || data.length === 0) {
    return columns.join(',') + '\n';
  }

  // Create header row
  const csvContent = [columns.join(',')];
  
  // Add data rows
  data.forEach(row => {
    const csvRow = columns.map(column => {
      const value = row[column] || '';
      // Handle values that contain commas, quotes, or newlines
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    });
    csvContent.push(csvRow.join(','));
  });
  
  return csvContent.join('\n');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: importId } = await params;
    let importData = null;

    // Try to get from database first
    const DatabaseService = await getDatabaseService();
    if (DatabaseService) {
      try {
        importData = await DatabaseService.getDataImportById(importId);
        console.log('Retrieved import from database:', importData?.id);
      } catch (error) {
        console.warn('Database retrieval failed:', error);
      }
    }

    // Fallback to in-memory storage
    if (!importData) {
      const inMemoryImports = getInMemoryStorage();
      // Search through all orgs in memory
      for (const [orgId, imports] of inMemoryImports.entries()) {
        const found = imports.find(imp => imp.id === importId);
        if (found) {
          importData = found;
          console.log('Retrieved import from memory:', found.id);
          break;
        }
      }
    }

    if (!importData) {
      console.log('Import not found in database or memory for ID:', importId);
      return NextResponse.json(
        { success: false, error: 'Import not found' },
        { status: 404 }
      );
    }

    console.log('Found import data:', {
      id: importData.id,
      filename: importData.filename,
      hasColumns: !!importData.columns,
      columnsLength: importData.columns?.length,
      hasParsedData: !!importData.parsedData,
      hasPreview: !!importData.preview,
      parsedDataLength: importData.parsedData?.length,
      previewLength: importData.preview?.length,
      dataSample: (importData.parsedData || importData.preview)?.slice(0, 2)
    });

    // Use either parsedData or preview (for backward compatibility)
    const dataToConvert = importData.parsedData || importData.preview;
    if (!dataToConvert || dataToConvert.length === 0) {
      console.log('No data found to convert to CSV');
      return NextResponse.json(
        { success: false, error: 'No data available for download' },
        { status: 404 }
      );
    }

    // Convert parsed data back to CSV
    const csvContent = convertToCSV(dataToConvert, importData.columns);
    
    console.log('Generated CSV preview:', csvContent.substring(0, 200));

    // Create response with CSV content
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${importData.filename || 'data.csv'}"`,
        'Cache-Control': 'no-cache',
      },
    });

    return response;
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download file' },
      { status: 500 }
    );
  }
} 