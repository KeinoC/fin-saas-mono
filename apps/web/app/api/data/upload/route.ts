import { NextRequest, NextResponse } from 'next/server';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Extend global type for development persistence
declare global {
  var inMemoryImports: Map<string, any[]> | undefined;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

// Simple in-memory storage for when database isn't available
// Use globalThis to persist across hot reloads in development
const getInMemoryStorage = () => {
  if (!globalThis.inMemoryImports) {
    globalThis.inMemoryImports = new Map();
  }
  return globalThis.inMemoryImports as Map<string, any[]>;
};

const inMemoryImports = getInMemoryStorage();

// Helper function to safely import Supabase
async function getSupabaseClient() {
  try {
    const { supabase } = await import('config');
    return supabase;
  } catch (error) {
    console.warn('Supabase not available:', error);
    return null;
  }
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

export async function POST(request: NextRequest) {
  console.log('Upload API called - Starting request processing');
  
  try {
    const formData = await request.formData();
    console.log('FormData parsed successfully');
    
    const file = formData.get('file') as File;
    const orgId = formData.get('orgId') as string;
    const userId = formData.get('userId') as string;

    console.log('Request data:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      orgId,
      userId
    });

    if (!file || !orgId || !userId) {
      console.log('Missing required fields:', { hasFile: !!file, orgId, userId });
      return NextResponse.json(
        { success: false, error: 'Missing required fields: file, orgId, or userId' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log('File size exceeded:', file.size, 'vs', MAX_FILE_SIZE);
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type - be more flexible with CSV detection
    const isCSV = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    const isExcel = file.type === 'application/vnd.ms-excel' || 
                   file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.name.toLowerCase().endsWith('.xlsx') ||
                   file.name.toLowerCase().endsWith('.xls');

    if (!isCSV && !isExcel) {
      console.log('File type validation failed:', {
        type: file.type,
        name: file.name,
        isCSV,
        isExcel
      });
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload CSV or Excel files only.' },
        { status: 400 }
      );
    }

    console.log('File validation passed:', {
      name: file.name,
      size: file.size,
      type: file.type,
      isCSV,
      isExcel
    });

    const buffer = await file.arrayBuffer();
    const fileContent = Buffer.from(buffer);

    let parsedData: any[] = [];
    let fileType: 'csv' | 'excel' = 'csv';

    try {
      if (isCSV) {
        // Parse CSV with better encoding handling
        let text: string;
        try {
          // Try UTF-8 first
          text = fileContent.toString('utf-8');
        } catch (encodingError) {
          // Fallback to latin1 for older CSV files
          console.log('UTF-8 failed, trying latin1 encoding');
          text = fileContent.toString('latin1');
        }
        
        console.log('CSV file content preview:', text.substring(0, 200));
        console.log('CSV file encoding check - first few chars:', text.charCodeAt(0), text.charCodeAt(1), text.charCodeAt(2));
        
        // First try with auto-detection
        let result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: '',  // Auto-detect delimiter
          newline: '',    // Auto-detect newline
          quoteChar: '"',
          escapeChar: '"',
          transformHeader: (header) => header.trim(),
          transform: (value) => value.trim(),
          dynamicTyping: false, // Keep as strings for now
          skipFirstNLines: 0,
          fastMode: false,  // Disable fast mode for better error handling
          comments: false,  // Don't treat any lines as comments
        });

        console.log('Papa parse result (auto-detect):', {
          data: result.data?.length || 0,
          errors: result.errors?.length || 0,
          meta: result.meta
        });

        // If auto-detection fails, try with more lenient settings
        if (result.errors.length > 0) {
          console.log('Auto-detect failed, trying lenient parsing');
          result = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            delimiter: ',',  // Force comma
            quoteChar: '"',
            escapeChar: '"',
            transformHeader: (header) => header.trim(),
            transform: (value) => value ? value.trim() : '',
            dynamicTyping: false,
            fastMode: false,
            comments: false,
            skipLinesWithError: true,  // Skip problematic lines
          });
          
          console.log('Papa parse result (lenient comma):', {
            data: result.data?.length || 0,
            errors: result.errors?.length || 0,
            meta: result.meta
          });
        }

        // If still failing with quotes, try without quote handling
        if (result.errors.length > 0) {
          console.log('Comma failed, trying without quote handling');
          result = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            delimiter: ',',
            quoteChar: '',  // Disable quote handling
            escapeChar: '',
            transformHeader: (header) => header.trim(),
            transform: (value) => value ? value.trim() : '',
            dynamicTyping: false,
            fastMode: false,
            comments: false,
            skipLinesWithError: true,
          });
          
          console.log('Papa parse result (no quotes):', {
            data: result.data?.length || 0,
            errors: result.errors?.length || 0,
            meta: result.meta
          });
        }

        // If still failing, try semicolon delimiter (European CSVs)
        if (result.errors.length > 0) {
          console.log('No quotes failed, trying semicolon delimiter');
          result = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            quoteChar: '',  // Disable quote handling
            escapeChar: '',
            transformHeader: (header) => header.trim(),
            transform: (value) => value ? value.trim() : '',
            dynamicTyping: false,
            fastMode: false,
            comments: false,
            skipLinesWithError: true,
          });
          
          console.log('Papa parse result (semicolon, no quotes):', {
            data: result.data?.length || 0,
            errors: result.errors?.length || 0,
            meta: result.meta
          });
        }

        // Final fallback: try tab delimiter
        if (result.errors.length > 0) {
          console.log('Semicolon failed, trying tab delimiter');
          result = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            delimiter: '\t',
            quoteChar: '',  // Disable quote handling
            escapeChar: '',
            transformHeader: (header) => header.trim(),
            transform: (value) => value ? value.trim() : '',
            dynamicTyping: false,
            fastMode: false,
            comments: false,
            skipLinesWithError: true,
          });
          
          console.log('Papa parse result (tab, no quotes):', {
            data: result.data?.length || 0,
            errors: result.errors?.length || 0,
            meta: result.meta
          });
        }

        // Final check - if we still have errors but got some data, let's proceed with warnings
        if (result.errors.length > 0 && result.data.length > 0) {
          console.log('CSV parsing completed with warnings - proceeding with available data');
        } else if (result.errors.length > 0) {
          console.error('CSV parsing errors:', result.errors);
          return NextResponse.json(
            { success: false, error: 'CSV parsing failed', details: result.errors.slice(0, 5) }, // Only show first 5 errors
            { status: 400 }
          );
        }

        if (!result.data || result.data.length === 0) {
          console.error('No data found in CSV file');
          return NextResponse.json(
            { success: false, error: 'No data found in CSV file. Please check the file format.' },
            { status: 400 }
          );
        }

        // Filter out completely empty rows
        parsedData = result.data.filter(row => {
          return Object.values(row).some(value => value && String(value).trim() !== '');
        });
        fileType = 'csv';
      } else if (isExcel) {
        // Parse Excel
        const workbook = XLSX.read(fileContent, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Convert to object format with headers
        if (parsedData.length > 0) {
          const headers = parsedData[0] as string[];
          const rows = parsedData.slice(1);
          parsedData = rows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });
        }

        fileType = 'excel';
      } else {
        console.error('Unknown file type after validation:', { type: file.type, name: file.name });
        return NextResponse.json(
          { success: false, error: 'Unsupported file format' },
          { status: 400 }
        );
      }

      console.log('Parsed data length:', parsedData?.length);
      console.log('First row sample:', parsedData?.[0]);

      // Validate data
      if (!parsedData || parsedData.length === 0) {
        console.error('No data found in parsed file');
        return NextResponse.json(
          { success: false, error: 'No data found in file' },
          { status: 400 }
        );
      }

      // Try to save to database (if available)
      let dataImport: any = null;
      const DatabaseService = await getDatabaseService();
      
      if (DatabaseService) {
        try {
          dataImport = await DatabaseService.createDataImport({
            orgId,
            fileType,
            data: parsedData,
            metadata: {
              originalFilename: file.name,
              fileSize: file.size,
              rowCount: parsedData.length,
              columns: Object.keys(parsedData[0] || {}),
              uploadedAt: new Date().toISOString(),
            },
            createdBy: userId,
          });
        } catch (dbError) {
          console.warn('Database operation failed:', dbError);
          // Create a mock data import object for response
          dataImport = {
            id: `temp-${Date.now()}`,
            orgId,
            filename: file.name,
            status: 'completed',
            rowCount: parsedData.length,
            fileSize: file.size,
            createdAt: new Date().toISOString(),
            uploadedBy: userId,
            columns: Object.keys(parsedData[0] || {}),
            preview: parsedData.slice(0, 5),
            fileUrl: null,
            metadata: {
              originalFilename: file.name,
              fileSize: file.size,
              rowCount: parsedData.length,
              columns: Object.keys(parsedData[0] || {}),
              uploadedAt: new Date().toISOString(),
            }
          };
          
          // Store in memory for this session
          const orgImports = inMemoryImports.get(orgId) || [];
          orgImports.push(dataImport);
          inMemoryImports.set(orgId, orgImports);
        }
      } else {
        // Create a mock data import object for response
        dataImport = {
          id: `temp-${Date.now()}`,
          orgId,
          filename: file.name,
          status: 'completed',
          rowCount: parsedData.length,
          fileSize: file.size,
          createdAt: new Date().toISOString(),
          uploadedBy: userId,
          columns: Object.keys(parsedData[0] || {}),
          preview: parsedData.slice(0, 5),
          fileUrl: null,
          metadata: {
            originalFilename: file.name,
            fileSize: file.size,
            rowCount: parsedData.length,
            columns: Object.keys(parsedData[0] || {}),
            uploadedAt: new Date().toISOString(),
          }
        };
        
        // Store in memory for this session
        const orgImports = inMemoryImports.get(orgId) || [];
        orgImports.push(dataImport);
        inMemoryImports.set(orgId, orgImports);
      }

      // Store the original file in Supabase Storage (if available)
      let storagePath = null;
      let storageUrl = null;
      
      try {
        const supabase = await getSupabaseClient();
        
        if (supabase && dataImport?.id) {
          const fileName = `${dataImport.id}-${file.name}`;
          const filePath = `data-imports/${orgId}/${fileName}`;
          
          const { data: storageData, error: storageError } = await supabase.storage
            .from('uploads')
            .upload(filePath, fileContent, {
              contentType: file.type,
              cacheControl: '3600',
              upsert: false
            });

          if (storageError) {
            console.warn('Failed to upload file to storage:', storageError);
          } else {
            storagePath = storageData.path;
            
            // Get the public URL
            const { data: urlData } = supabase.storage
              .from('uploads')
              .getPublicUrl(filePath);
            
            storageUrl = urlData.publicUrl;
            
            // Update the data import with storage information if database is available
            if (DatabaseService) {
              try {
                await DatabaseService.updateDataImport(dataImport.id, {
                  metadata: {
                    ...dataImport.metadata,
                    storagePath,
                    storageUrl,
                  } as any,
                });
              } catch (updateError) {
                console.warn('Failed to update data import with storage info:', updateError);
              }
            } else {
              // Update in-memory storage
              dataImport.fileUrl = storageUrl;
              const orgImports = inMemoryImports.get(orgId) || [];
              const index = orgImports.findIndex(imp => imp.id === dataImport.id);
              if (index !== -1) {
                orgImports[index] = dataImport;
                inMemoryImports.set(orgId, orgImports);
              }
            }
          }
        } else {
          console.warn('Supabase not available - skipping file storage');
        }
      } catch (storageError) {
        console.warn('Storage operation failed:', storageError);
      }

      // Create notification (if database is available)
      if (DatabaseService) {
        try {
          await DatabaseService.createNotification({
            orgId,
            userId,
            type: 'data_import_success',
            message: `Successfully imported ${parsedData.length} rows from ${file.name}`,
          });
        } catch (notificationError) {
          console.warn('Failed to create notification:', notificationError);
        }
      }

      return NextResponse.json({
        success: true,
        dataImport: {
          id: dataImport.id,
          rowCount: parsedData.length,
          columns: Object.keys(parsedData[0] || {}),
          preview: parsedData.slice(0, 5), // First 5 rows for preview
        },
      });

    } catch (parseError) {
      console.error('File parsing error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Failed to parse file content' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Upload error:', error);
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export the in-memory storage for access by the imports endpoint
export { inMemoryImports }; 