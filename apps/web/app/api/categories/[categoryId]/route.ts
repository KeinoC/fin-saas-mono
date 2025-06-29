import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from 'database';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Temporarily skip auth check for development
    const { categoryId } = await params;
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
    const { categoryId } = await params;
    console.error(`Error updating category ${categoryId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Temporarily skip auth check for development
    const { categoryId } = await params;

    await DatabaseService.deleteCategory(categoryId);

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (error) {
    const { categoryId } = await params;
    console.error(`Error deleting category ${categoryId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 