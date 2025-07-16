import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Aggregate data by source from TransformedData table
    const sourceStats = await prisma.transformedData.groupBy({
      by: ['source', 'dataType'],
      where: {
        orgId: orgId,
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
      _min: {
        date: true,
        createdAt: true,
      },
      _max: {
        date: true,
        createdAt: true,
      },
    });

    // Process the aggregated data to create data source summaries
    const sourceMap = new Map();

    sourceStats.forEach((stat: any) => {
      const sourceKey = stat.source;
      
      if (!sourceMap.has(sourceKey)) {
        sourceMap.set(sourceKey, {
          source: sourceKey,
          count: 0,
          totalAmount: 0,
          dataType: new Set(),
          dateRange: {
            earliest: stat._min.date,
            latest: stat._max.date,
          },
          lastUpdated: stat._max.createdAt,
        });
      }

      const existing = sourceMap.get(sourceKey);
      existing.count += stat._count.id;
      existing.totalAmount += Number(stat._sum.amount || 0);
      existing.dataType.add(stat.dataType);
      
      // Update date ranges
      if (stat._min.date && stat._min.date < existing.dateRange.earliest) {
        existing.dateRange.earliest = stat._min.date;
      }
      if (stat._max.date && stat._max.date > existing.dateRange.latest) {
        existing.dateRange.latest = stat._max.date;
      }
      if (stat._max.createdAt && stat._max.createdAt > existing.lastUpdated) {
        existing.lastUpdated = stat._max.createdAt;
      }
    });

    // Convert to array and format
    const sources = Array.from(sourceMap.values()).map(source => ({
      ...source,
      dataType: Array.from(source.dataType),
    }));

    // Sort by count descending
    sources.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      sources,
      summary: {
        totalSources: sources.length,
        totalRecords: sources.reduce((sum, s) => sum + s.count, 0),
        totalAmount: sources.reduce((sum, s) => sum + s.totalAmount, 0),
      }
    });

  } catch (error) {
    console.error('Error fetching warehouse data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse data' },
      { status: 500 }
    );
  }
} 