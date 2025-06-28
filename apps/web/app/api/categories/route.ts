import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from 'database';

export async function GET(request: NextRequest) {
  try {
    // Temporarily skip auth check for development
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    const categories = await DatabaseService.getCategoriesByOrgId(orgId);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Temporarily skip auth check for development
    const body = await request.json();
    const { orgId, name, parentId, businessType, color, taxType, taxRate, isSystem } = body;

    if (!orgId || !name) {
      return NextResponse.json({ error: 'orgId and name are required' }, { status: 400 });
    }

    const newCategory = await DatabaseService.createCategory({
      orgId,
      name,
      parentId,
      businessType,
      color,
      taxType,
      taxRate,
      isSystem,
      createdBy: 'system', // Hardcoded for now
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 