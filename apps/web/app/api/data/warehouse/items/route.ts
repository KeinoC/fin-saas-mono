import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const source = searchParams.get('source');
    const dataType = searchParams.get('dataType');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      orgId: orgId,
    };

    if (source && source !== 'all') {
      where.source = source.toUpperCase();
    }

    if (dataType && dataType !== 'all') {
      where.dataType = dataType.toUpperCase();
    }

    // Fetch transformed data items
    const items = await prisma.transformedData.findMany({
      where,
      select: {
        id: true,
        name: true,
        date: true,
        amount: true,
        source: true,
        dataType: true,
        data: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Format the response to extract category data from JSON
    const formattedItems = items.map(item => {
      const data = item.data as any || {};
      return {
        id: item.id,
        name: item.name,
        date: item.date.toISOString(),
        amount: Number(item.amount),
        source: item.source,
        dataType: item.dataType,
        categoryLevel1: data.categoryLevel1 || null,
        categoryLevel2: data.categoryLevel2 || null,
        categoryLevel3: data.categoryLevel3 || null,
      };
    });

    return NextResponse.json({
      items: formattedItems,
      total: formattedItems.length,
    });

  } catch (error) {
    console.error('Error fetching warehouse items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse items' },
      { status: 500 }
    );
  }
} 