import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from 'database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    // Temporarily skip auth check for development
    const categoryId = params.categoryId;
    const body = await request.json();
    const { name, parentId, businessType, color, taxType, taxRate } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updatedCategory = await DatabaseService.updateCategory(categoryId, {
      name,
      parentId,
      businessType,
      color,
      taxType,
      taxRate,
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error(`Error updating category ${params.categoryId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    // Temporarily skip auth check for development
    const categoryId = params.categoryId;

    await DatabaseService.deleteCategory(categoryId);

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting category ${params.categoryId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 