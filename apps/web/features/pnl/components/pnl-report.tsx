'use client';

import { useState, useEffect } from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type PnlData = any;

export default function PnlReport() {
  const [data, setData] = useState<PnlData | null>(null);
  const [filters, setFilters] = useState({
    dateRange: 'monthly',
    dataTypes: ['ACTUAL'],
  });

  useEffect(() => {
    const fetchData = async () => {
      // TODO: Get orgId from session
      const orgId = 'test-org-id';
      const params = new URLSearchParams({
        orgId,
        dataTypes: filters.dataTypes.join(','),
      });

      // TODO: Add date range to params
      
      try {
        const response = await fetch(`/api/pnl/data?${params.toString()}`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch data');
        }
        setData(result);
      } catch (error) {
        console.error('Failed to fetch P&L data:', error);
        // TODO: show error toast
      }
    };

    fetchData();
  }, [filters]);

  const renderCategoryTree = (categoryName: string, categoryData: any, level = 0) => {
    if (typeof categoryData === 'number') {
      return (
        <div className="flex justify-between py-2">
          <span>{categoryName}</span>
          <span>${categoryData.toLocaleString()}</span>
        </div>
      );
    }

    return (
      <Disclosure as="div" className="mt-2">
        {({ open }) => (
          <>
            <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-100 px-4 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75">
              <span>{categoryName}</span>
              <div className="flex items-center">
                <span className="mr-4 font-semibold">${categoryData.total?.toLocaleString() || '0'}</span>
                <ChevronUpIcon className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-indigo-500`} />
              </div>
            </Disclosure.Button>
            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-700" style={{ marginLeft: `${level * 20}px` }}>
              {categoryData.breakdown && Object.entries(categoryData.breakdown).map(([subCategoryName, subCategoryData]) => (
                <div key={subCategoryName} className="ml-4">
                  {renderCategoryTree(subCategoryName, subCategoryData, level + 1)}
                </div>
              ))}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    );
  };

  const handleFilterChange = (dataType: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      dataTypes: checked 
        ? [...prev.dataTypes, dataType]
        : prev.dataTypes.filter(type => type !== dataType)
    }));
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-1/4 bg-white p-6 border-r">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div>
          <Label>Data Type</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="actual" 
                checked={filters.dataTypes.includes('ACTUAL')} 
                onCheckedChange={(checked) => handleFilterChange('ACTUAL', !!checked)}
              />
              <Label htmlFor="actual">Actual</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="budget" 
                checked={filters.dataTypes.includes('BUDGET')} 
                onCheckedChange={(checked) => handleFilterChange('BUDGET', !!checked)}
              />
              <Label htmlFor="budget">Budget</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="forecast" 
                checked={filters.dataTypes.includes('FORECAST')} 
                onCheckedChange={(checked) => handleFilterChange('FORECAST', !!checked)}
              />
              <Label htmlFor="forecast">Forecast</Label>
            </div>
          </div>
        </div>
      </aside>
      <main className="w-3/4 p-6">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Profit & Loss</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline">Define Hierarchy Level</Button>
            <Button variant="outline">Export P&L</Button>
          </div>
        </header>
        <div>
          {data ? (
            <>
              {data.Revenue !== undefined && renderCategoryTree('Revenue', data.Revenue)}
              {data.Expenses && renderCategoryTree('Expenses', data.Expenses)}
              <div className="flex justify-between py-2 mt-4 font-bold border-t-2 border-gray-800">
                <span>Net Income</span>
                <span>${data['Net Income']?.toLocaleString() || '0'}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading P&L data...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}