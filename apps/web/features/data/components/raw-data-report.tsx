'use client';

import { useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// TODO: Define types for parsed data
type CsvRow = Record<string, string>;
type CsvData = CsvRow[];
type HierarchyMapping = {
  level: number;
  csvColumn: string;
};

export default function RawDataReport() {
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataImportId, setDataImportId] = useState<string | null>(null);
  const [sectionMappingType, setSectionMappingType] = useState<'single' | 'column'>('single');
  const [section, setSection] = useState<'Revenue' | 'Expenses'>('Expenses');
  const [sectionColumn, setSectionColumn] = useState<string | null>(null);
  const [hierarchyMappings, setHierarchyMappings] = useState<HierarchyMapping[]>([
    { level: 1, csvColumn: '' },
  ]);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      // TODO: Get orgId and userId from session/auth
      formData.append('orgId', 'test-org-id');
      formData.append('userId', 'test-user-id');

      try {
        const response = await fetch('/api/data/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          setHeaders(result.headers || []);
          setCsvData(result.data || []);
          setDataImportId(result.dataImportId);
        } else {
          // TODO: Show an error toast
          console.error('Upload failed:', result.error);
        }
      } catch (error) {
        // TODO: Show an error toast
        console.error('Upload error:', error);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] } });

  const addHierarchyLevel = () => {
    const newLevel = hierarchyMappings.length + 1;
    setHierarchyMappings([...hierarchyMappings, { level: newLevel, csvColumn: '' }]);
  };

  const removeHierarchyLevel = (levelToRemove: number) => {
    setHierarchyMappings(
      hierarchyMappings
        .filter(m => m.level !== levelToRemove)
        .map((m, i) => ({ ...m, level: i + 1 }))
    );
  };

  const handleHierarchyChange = (level: number, csvColumn: string) => {
    setHierarchyMappings(
      hierarchyMappings.map(m => (m.level === level ? { ...m, csvColumn } : m))
    );
  };

  const handleTransform = async () => {
    if (!dataImportId) {
      // TODO: Show an error toast
      console.error('No data import ID available');
      return;
    }

    try {
      const response = await fetch('/api/data/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataImportId,
          sectionMappingType,
          section,
          sectionColumn,
          hierarchyMappings,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // TODO: Show a success toast and maybe redirect
        console.log('Transformation successful:', result);
      } else {
        // TODO: Show an error toast
        console.error('Transformation failed:', result.error);
      }
    } catch (error) {
      // TODO: Show an error toast
      console.error('Transform error:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Raw Data Mapping</h1>
        <div className="flex items-center space-x-2 mt-2">
          <Button onClick={handleTransform} disabled={!dataImportId}>Transform Data</Button>
          <Button variant="outline">Export Raw Data</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-md text-center cursor-pointer
            ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}>
            <input {...getInputProps()} />
            <p>Drag 'n' drop a CSV file here, or click to select a file</p>
          </div>
        </div>

        {csvData && (
          <>
            <div className="lg:col-span-3 bg-white p-4 rounded-md shadow">
              <h2 className="text-lg font-semibold mb-4">CSV Data</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {headers.map(header => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {csvData.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        {headers.map(header => (
                          <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Mapping Panel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-lg font-semibold">Section Identification</Label>
                    <RadioGroup value={sectionMappingType} onValueChange={(value) => setSectionMappingType(value as 'single' | 'column')} className="mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="r1" />
                        <Label htmlFor="r1">This file represents a single core P&L section</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="column" id="r2" />
                        <Label htmlFor="r2">Map a column to P&L sections</Label>
                      </div>
                    </RadioGroup>

                    {sectionMappingType === 'single' && (
                      <div className="mt-4">
                        <Select value={section} onValueChange={(value) => setSection(value as 'Revenue' | 'Expenses')}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Revenue">Revenue</SelectItem>
                            <SelectItem value="Expenses">Expenses</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {sectionMappingType === 'column' && (
                      <div className="mt-4">
                        <Label>Select column that contains section information</Label>
                        <Select value={sectionColumn || ''} onValueChange={setSectionColumn}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {/* TODO: Add table to map column values to sections */}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-lg font-semibold">Hierarchy Mapping</Label>
                    <div className="space-y-4 mt-2">
                      {hierarchyMappings.map(mapping => (
                        <div key={mapping.level} className="flex items-center space-x-4">
                          <Label>Level {mapping.level}</Label>
                          <Select
                            value={mapping.csvColumn}
                            onValueChange={(value) => handleHierarchyChange(mapping.level, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select CSV Column" />
                            </SelectTrigger>
                            <SelectContent>
                              {headers.map(header => (
                                <SelectItem key={header} value={header}>{header}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {hierarchyMappings.length > 1 && (
                            <Button variant="ghost" onClick={() => removeHierarchyLevel(mapping.level)}>Remove</Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button variant="link" onClick={addHierarchyLevel} className="mt-2">
                      + Add Hierarchy Level
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">Preview</h3>
                     {/* Preview will go here */}
                  </div>

                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 