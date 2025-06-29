'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Database, 
  Search, 
  RefreshCw, 
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  FileText,
  Upload
} from 'lucide-react';

interface DataWarehousePageProps {
  params: Promise<{ orgId: string }>;
}

interface DataSource {
  source: string;
  count: number;
  totalAmount: number;
  lastUpdated: Date;
  dataType: string[];
  dateRange: {
    earliest: Date;
    latest: Date;
  };
}

export default async function DataWarehousePage({ params }: DataWarehousePageProps) {
  const { orgId } = await params;
  
  return (
    <PageLayout
      title="Data Warehouse"
      description="Browse and manage all your data sources and transformed data."
    >
      <DataWarehouseContent orgId={orgId} />
    </PageLayout>
  );
}

function DataWarehouseContent({ orgId }: { orgId: string }) {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadDataSources();
  }, [orgId]);

  const loadDataSources = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/data/warehouse?orgId=${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setDataSources(data.sources || []);
      } else {
        console.error('Failed to load data sources');
        setDataSources([]);
      }
    } catch (error) {
      console.error('Error loading data sources:', error);
      setDataSources([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'csv':
        return Upload;
      case 'google_sheets':
        return FileText;
      case 'plaid':
        return DollarSign;
      case 'acuity':
        return Calendar;
      default:
        return Database;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'csv':
        return 'bg-blue-100 text-blue-800';
      case 'google_sheets':
        return 'bg-green-100 text-green-800';
      case 'plaid':
        return 'bg-purple-100 text-purple-800';
      case 'acuity':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSources = dataSources.filter(source => {
    const matchesSearch = source.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSourceFilter = sourceFilter === 'all' || source.source.toLowerCase() === sourceFilter.toLowerCase();
    const matchesTypeFilter = typeFilter === 'all' || source.dataType.some(type => type.toLowerCase() === typeFilter.toLowerCase());
    
    return matchesSearch && matchesSourceFilter && matchesTypeFilter;
  });

  const totalRecords = dataSources.reduce((sum, source) => sum + source.count, 0);
  const totalAmount = dataSources.reduce((sum, source) => sum + source.totalAmount, 0);
  const uniqueSources = new Set(dataSources.map(s => s.source)).size;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
              </div>
              <Database className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${Math.abs(totalAmount).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Sources</p>
                <p className="text-2xl font-bold">{uniqueSources}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>
            Browse all data sources and their content in your warehouse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search data sources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="google_sheets">Google Sheets</SelectItem>
                <SelectItem value="plaid">Plaid</SelectItem>
                <SelectItem value="acuity">Acuity</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="actual">Actual</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="forecast">Forecast</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadDataSources} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Data Sources List */}
          <div className="space-y-4">
            {filteredSources.length === 0 ? (
              <div className="text-center py-12">
                <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No data sources found</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || sourceFilter !== 'all' || typeFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Upload some data to get started'}
                </p>
              </div>
            ) : (
              filteredSources.map((source, index) => {
                const Icon = getSourceIcon(source.source);
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{source.source}</h3>
                              <Badge className={getSourceColor(source.source)}>
                                {source.source.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Records:</span> {source.count.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Total Amount:</span> ${Math.abs(source.totalAmount).toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Data Types:</span> {source.dataType.join(', ')}
                              </div>
                              <div>
                                <span className="font-medium">Last Updated:</span> {source.lastUpdated.toLocaleDateString()}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              <span className="font-medium">Date Range:</span> {source.dateRange.earliest.toLocaleDateString()} - {source.dateRange.latest.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 