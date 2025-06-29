import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataImportId, sectionMappingType, section, sectionColumn, hierarchyMappings } = body;

    if (!dataImportId || !hierarchyMappings) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const dataImport = await prisma.dataImport.findUnique({
      where: { id: dataImportId },
    });

    if (!dataImport) {
      return NextResponse.json({ success: false, error: 'Data import not found' }, { status: 404 });
    }

    const rawData = dataImport.data as any[];
    const transformedData: any[] = [];

    for (const row of rawData) {
      const data: Record<string, string> = {};

      // Section mapping
      let pnlSection = section;
      if (sectionMappingType === 'column' && sectionColumn && row[sectionColumn]) {
        // This is a simplified mapping. A real implementation would have a mapping table.
        const sectionValue = row[sectionColumn].toLowerCase();
        if (sectionValue.includes('revenue') || sectionValue.includes('income')) {
            pnlSection = 'Revenue';
        } else if (sectionValue.includes('expense') || sectionValue.includes('cost')) {
            pnlSection = 'Expenses';
        }
      }
      data['categoryLevel1'] = pnlSection;
      
      // Hierarchy mapping
      for (const mapping of hierarchyMappings) {
        if (mapping.csvColumn && row[mapping.csvColumn]) {
          data[`categoryLevel${mapping.level + 1}`] = row[mapping.csvColumn];
        }
      }
      
      // TODO: Get these from the CSV data based on some mapping
      const name = row['Description'] || row['name'] || 'N/A';
      const date = new Date(row['Date'] || row['date']);
      const amount = parseFloat(row['Amount'] || row['amount'] || 0);

      if (!isNaN(date.getTime()) && !isNaN(amount)) {
          transformedData.push({
            orgId: dataImport.orgId,
            name,
            date,
            amount,
            source: 'CSV',
            dataType: 'ACTUAL',
            data,
            createdBy: dataImport.createdBy,
          });
      }
    }
    
    await prisma.transformedData.createMany({
      data: transformedData,
    });

    return NextResponse.json({ success: true, count: transformedData.length });

  } catch (error) {
    console.error('Error in transform API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
} 