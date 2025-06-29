'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, MoreHorizontal, Search, Circle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { PageLayout } from '@/components/layout/page-layout';

interface Category {
  id: string;
  name: string;
  isSystem: boolean;
  color: string | null;
  taxRate: number | string | null;
  parentId: string | null;
  children?: Category[];
}

type PageState = {
  status: 'loading' | 'error' | 'success' | 'idle';
  message?: string;
};

export default function CategoriesPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [pageState, setPageState] = useState<PageState>({ status: 'idle' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!orgId) return;

    setPageState({ status: 'loading' });
    try {
      const response = await fetch(`/api/categories?orgId=${orgId}`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      
      const buildHierarchy = (items: Category[]): Category[] => {
        const map = new Map(items.map(item => [item.id, { ...item, children: [] as Category[] }]));
        const roots: Category[] = [];
        map.forEach(item => {
          if (item.parentId && map.has(item.parentId)) {
            map.get(item.parentId)?.children.push(item);
          } else {
            roots.push(item);
          }
        });
        return roots;
      };

      setCategories(buildHierarchy(data));
      setPageState({ status: 'success' });
    } catch (err) {
      setPageState({ status: 'error', message: err instanceof Error ? err.message : 'An unknown error occurred' });
    }
  }, [orgId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  const filteredCategories = useMemo(() => {
    if (!searchTerm) {
      return categories.filter(c => !c.parentId);
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    
    function filter(array: Category[]): Category[] {
      return array.reduce((acc, cat) => {
        const children = cat.children ? filter(cat.children) : [];
        if (cat.name.toLowerCase().includes(lowercasedFilter) || children.length > 0) {
          acc.push({ ...cat, children });
        }
        return acc;
      }, [] as Category[]);
    }
    
    return filter(categories);
  }, [categories, searchTerm]);

  const handleModalOpen = (category: Partial<Category> | null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = async (categoryId: string) => {
    if (window.confirm('Are you sure? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete category');
        fetchCategories();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const renderCategoryRows = (cats: Category[], level = 0): React.ReactNode => {
    return cats.flatMap(category => [
      <TableRow key={category.id}>
        <TableCell style={{ paddingLeft: `${level * 24 + 16}px` }}>
          <div className="flex items-center gap-3">
            <Circle className="h-4 w-4" style={{ color: category.color || '#ccc', fill: category.color || '#ccc' }} />
            <span className="font-medium">{category.name}</span>
            {category.isSystem && <Badge variant="secondary">System</Badge>}
          </div>
        </TableCell>
        <TableCell>{category.taxRate ? `${Number(category.taxRate) * 100}%` : '-'}</TableCell>
        <TableCell className="text-right">
          {!category.isSystem && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleModalOpen(category)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(category.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
      </TableRow>,
      category.children && renderCategoryRows(category.children, level + 1)
    ]);
  };

  const renderContent = () => {
    if (pageState.status === 'loading' || pageState.status === 'idle') {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (pageState.status === 'error') {
      return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Categories</h3>
            <p className="text-gray-600 mb-4">{pageState.message || 'An error occurred while loading categories. Please try again.'}</p>
            <button
              onClick={() => fetchCategories()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-700 hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-[50%]">Name</TableHead>
              <TableHead>Tax Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length > 0 ? (
              renderCategoryRows(filteredCategories)
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No categories found. Click the Create button above to add a new category.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  const pageActions = (
    <Button onClick={() => handleModalOpen({})}>
      <PlusCircle className="mr-2 h-4 w-4" /> Create Category
    </Button>
  );

  return (
    <PageLayout
      title="Categories"
      description="Manage your expense and income categories."
      actions={pageActions}
    >
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Your Categories</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search categories..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
      
      {isModalOpen && (
        <CategoryModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={fetchCategories}
          category={editingCategory}
          orgId={orgId}
        />
      )}
    </PageLayout>
  );
}

function CategoryModal({ isOpen, onClose, onSave, category, orgId }: {
  isOpen: boolean,
  onClose: () => void,
  onSave: () => void,
  category: Partial<Category> | null,
  orgId: string,
}) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    color: category?.color || '#000000',
    taxRate: category?.taxRate ? String(Number(category.taxRate) * 100) : '',
  });

  const handleSave = async () => {
    const url = category?.id ? `/api/categories/${category.id}` : `/api/categories`;
    const method = category?.id ? 'PUT' : 'POST';

    const body = {
      ...formData,
      taxRate: formData.taxRate ? parseFloat(formData.taxRate) / 100 : null,
      orgId,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to save category');
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category?.id ? 'Edit Category' : 'Create Category'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData(f => ({...f, name: e.target.value}))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <Input 
                id="color" 
                type="color" 
                className="p-1 h-10 w-10"
                value={formData.color} 
                onChange={e => setFormData(f => ({...f, color: e.target.value}))}
              />
              <Input 
                className="flex-1"
                value={formData.color} 
                onChange={e => setFormData(f => ({...f, color: e.target.value}))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input id="taxRate" type="number" placeholder="e.g., 8.5" value={formData.taxRate} onChange={e => setFormData(f => ({...f, taxRate: e.target.value}))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 