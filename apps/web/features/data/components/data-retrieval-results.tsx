'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Download, 
  Save, 
  FileText, 
  Calendar,
  DollarSign,
  Database,
  X,
  ChevronRight,
  Eye
} from 'lucide-react';

interface DataRecord {
  id: string;
  date: string;
  type: string;
  [key: string]: any;
}

interface DataRetrievalResultsProps {
  data: DataRecord[];
  metadata: {
    source: string;
    dateRange: string;
    dataType: string;
    recordsRetrieved: number;
    retrievedAt: string;
  };
  orgId: string;
  onClose: () => void;
  onExport?: (format: 'csv' | 'excel') => void;
  onSaved?: () => void;
}

interface ObjectModalData {
  header: string;
  content: any;
  isVisible: boolean;
}

export function DataRetrievalResults({ 
  data, 
  metadata, 
  orgId,
  onClose, 
  onExport,
  onSaved
}: DataRetrievalResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [objectModal, setObjectModal] = useState<ObjectModalData>({
    header: '',
    content: null,
    isVisible: false
  });
  const recordsPerPage = 10;
  
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(data.length / recordsPerPage);

  const isObject = (value: any): boolean => {
    return value !== null && 
           typeof value === 'object' && 
           !Array.isArray(value) && 
           !(value instanceof Date);
  };

  const isArray = (value: any): boolean => {
    return Array.isArray(value);
  };

  const getObjectPreview = (obj: any): string => {
    if (isArray(obj)) {
      return `[${obj.length} items]`;
    }
    if (isObject(obj)) {
      const keys = Object.keys(obj);
      return `{${keys.length} fields}`;
    }
    return String(obj);
  };

  const handleObjectClick = (header: string, content: any) => {
    setObjectModal({
      header,
      content,
      isVisible: true
    });
  };

  const renderObjectContent = (obj: any) => {
    if (isArray(obj)) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Array with {obj.length} items:</p>
          <div className="max-h-64 overflow-y-auto">
            {obj.map((item: any, index: number) => (
              <div key={index} className="border rounded p-2 text-xs">
                <span className="font-medium text-gray-500">[{index}]:</span>
                <span className="ml-2">
                  {isObject(item) || isArray(item) 
                    ? JSON.stringify(item, null, 2)
                    : String(item)
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isObject(obj)) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Object with {Object.keys(obj).length} fields:</p>
          <div className="max-h-64 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Key</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(obj).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium text-gray-700 text-xs">
                      {key}
                    </TableCell>
                    <TableCell className="text-xs">
                      {isObject(value) || isArray(value) 
                        ? (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-800">
                              {getObjectPreview(value)}
                            </summary>
                            <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(value, null, 2)}
                            </pre>
                          </details>
                        )
                        : String(value)
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    return (
      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
        {JSON.stringify(obj, null, 2)}
      </pre>
    );
  };

  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return '-';
    
    if (key.toLowerCase().includes('date')) {
      return new Date(value).toLocaleDateString();
    }
    
    if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('value')) {
      return typeof value === 'number' ? `$${value.toFixed(2)}` : value;
    }
    
    return String(value);
  };

  const handleSaveToSystem = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/data/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          data,
          metadata,
          name: `${metadata.source} - ${metadata.dataType} (${new Date().toLocaleDateString()})`,
          description: `Retrieved ${metadata.recordsRetrieved} ${metadata.dataType} records from ${metadata.source}`
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save data');
      }

      alert(`✅ Successfully saved ${result.recordsSaved} records to the system!`);
      onSaved?.();
    } catch (error) {
      console.error('Save error:', error);
      alert(`❌ Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getSourceIcon = (source: string) => {
    if (source.toLowerCase().includes('google')) return <FileText className="w-4 h-4" />;
    if (source.toLowerCase().includes('acuity')) return <Calendar className="w-4 h-4" />;
    if (source.toLowerCase().includes('plaid')) return <DollarSign className="w-4 h-4" />;
    return <Database className="w-4 h-4" />;
  };

  // Get all unique keys from the data for table headers
  const tableHeaders = data.length > 0 
    ? Array.from(new Set(data.flatMap(record => Object.keys(record))))
      .filter(key => key !== 'id') // Exclude ID from display
    : [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {getSourceIcon(metadata.source)}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Data Retrieval Results
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {metadata.recordsRetrieved} records
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Retrieved from {metadata.source} • {new Date(metadata.retrievedAt).toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metadata Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-500">Date Range</div>
            <div className="font-medium">
              {metadata.dateRange === 'all' ? 'All time' : `Last ${metadata.dateRange} days`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Data Type</div>
            <div className="font-medium capitalize">{metadata.dataType}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Records</div>
            <div className="font-medium">{metadata.recordsRetrieved}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Source</div>
            <div className="font-medium">{metadata.source}</div>
          </div>
        </div>

        {/* Data Table */}
        {data.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableHeaders.map(header => (
                      <TableHead 
                        key={header} 
                        className="text-left font-medium text-gray-700 capitalize text-xs py-2"
                      >
                        {header.replace(/([A-Z])/g, ' $1').trim()}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRecords.map((record, index) => (
                    <TableRow key={record.id}>
                      {tableHeaders.map(header => {
                        const value = record[header];
                        const isObjectValue = isObject(value) || isArray(value);
                        
                        return (
                          <TableCell key={header} className="py-1.5 text-xs">
                            {isObjectValue ? (
                              <button
                                onClick={() => handleObjectClick(`${header} - Record ${index + 1}`, value)}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded px-2 py-1 transition-colors"
                                title="Click to view details"
                              >
                                <Eye className="w-3 h-3" />
                                <span className="text-xs">{getObjectPreview(value)}</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            ) : (
                              formatValue(header, value)
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} records
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No data retrieved with the current filters.
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            onClick={() => onExport?.('csv')}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => onExport?.('excel')}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSaveToSystem}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save to System'}
          </Button>
        </div>
      </CardContent>

      {/* Object Details Modal */}
      <Dialog open={objectModal.isVisible} onOpenChange={(open) => setObjectModal(prev => ({ ...prev, isVisible: open }))}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              {objectModal.header}
            </DialogTitle>
            <DialogDescription>
              Detailed view of nested data structure
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {objectModal.content && renderObjectContent(objectModal.content)}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 