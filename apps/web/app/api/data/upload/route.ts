import { NextRequest, NextResponse } from 'next/server';
import * as Papa from 'papaparse';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  console.log('=== CSV Upload Request Started ===');
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    // TODO: Get orgId and userId from session/auth
    const orgId = formData.get('orgId') as string;
    const userId = formData.get('userId') as string;

    console.log('Upload request details:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      orgId,
      userId,
      formDataKeys: Array.from(formData.keys())
    });

    if (!file || !orgId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: file, orgId, or userId' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }
    
    const isCSV = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    if (!isCSV) {
        return NextResponse.json(
            { success: false, error: 'Invalid file type. Please upload CSV files only.' },
            { status: 400 }
        );
    }

    const fileContent = await file.text();
    
    let parsedData: any[] = [];
    
    console.log('File content preview:', fileContent.slice(0, 200) + (fileContent.length > 200 ? '...' : ''));
    
    const result = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    console.log('Papa parse result:', {
      dataRows: result.data?.length || 0,
      fields: result.meta?.fields || [],
      errors: result.errors,
      aborted: result.meta?.aborted
    });

    if (result.errors.length > 0) {
      console.error('CSV parsing errors:', result.errors);
      return NextResponse.json(
        { success: false, error: 'CSV parsing failed', details: result.errors.slice(0, 5) },
        { status: 400 }
      );
    }

    if (!result.data || result.data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data found in CSV file.' },
        { status: 400 }
      );
    }
    
    parsedData = result.data;

    console.log('Creating dataImport record...');
    
    // Development: Ensure organization exists (create if missing)
    if (process.env.NODE_ENV === 'development') {
      await prisma.organization.upsert({
        where: { id: orgId },
        update: {},
        create: {
          id: orgId,
          name: 'Development Organization',
          subscriptionPlan: 'free',
          currency: 'USD',
        }
      });
      console.log('Development org ensured:', orgId);
    }
    
    const dataImport = await prisma.dataImport.create({
        data: {
          orgId,
          fileType: 'csv',
          data: parsedData,
          createdBy: userId,
        },
    });

    console.log('=== CSV Upload Success ===', {
      dataImportId: dataImport.id,
      rowCount: parsedData.length,
      headers: result.meta.fields
    });

    return NextResponse.json({ success: true, dataImportId: dataImport.id, data: parsedData, headers: result.meta.fields });

  } catch (error) {
    console.error('Error in upload API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}