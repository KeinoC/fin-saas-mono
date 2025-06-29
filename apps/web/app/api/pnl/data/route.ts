import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, DataType } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // TODO: Get orgId from session
  const orgId = searchParams.get('orgId') || 'test-org-id';
  const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();
  const dataTypes = (searchParams.get('dataTypes')?.split(',') as DataType[]) || [DataType.ACTUAL];

  try {
    const data = await prisma.transformedData.findMany({
      where: {
        orgId,
        date: { gte: startDate, lte: endDate },
        dataType: { in: dataTypes },
      },
      select: { amount: true, data: true },
    });

    const rollups: Record<string, any> = {
        Revenue: 0,
        Expenses: { total: 0, breakdown: {} }
    };

    for (const item of data) {
      const itemData = item.data as any;
      const categoryLevel1 = itemData.categoryLevel1;

      if (categoryLevel1 === 'Revenue') {
        rollups.Revenue += Number(item.amount);
      } else if (categoryLevel1 === 'Expenses') {
        rollups.Expenses.total += Number(item.amount);
        
        let currentLevel = rollups.Expenses.breakdown;
        for (let i = 2; itemData[`categoryLevel${i}`]; i++) {
            const category = itemData[`categoryLevel${i}`];
            if (!currentLevel[category]) {
                currentLevel[category] = { total: 0, breakdown: {} };
            }
            currentLevel[category].total += Number(item.amount);
            currentLevel = currentLevel[category].breakdown;
        }
      }
    }
    
    rollups['Net Income'] = rollups.Revenue - rollups.Expenses.total;

    return NextResponse.json(rollups);

  } catch (error) {
    console.error('Error fetching P&L data:', error);
    return NextResponse.json({ error: 'Failed to fetch P&L data' }, { status: 500 });
  }
} 