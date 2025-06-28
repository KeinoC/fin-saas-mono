'use client';

import { useState, useEffect } from 'react';
import { FileUploader } from '@/features/data/components/file-uploader';
import { DataImportsList } from '@/features/data/components/data-imports-list';
import { DataRetrievalResults } from '@/features/data/components/data-retrieval-results';

import { useSession } from '@/lib/auth-client';
import { formatUserDisplayName } from '@/lib/user-utils';
import { useAppStore } from '@/lib/stores/app-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cloud, 
  Upload, 
  Download, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar,
  Chrome,
  CreditCard,
  RefreshCw,
  Settings,
  ExternalLink,
  Search,
  Info,
  Loader2
} from 'lucide-react';

interface DataSourcePageProps {
  params: Promise<{ orgId: string }>;
}

interface Integration {
  id: string;
  name: string;
  type: 'google' | 'acuity' | 'plaid' | 'manual';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  recordCount?: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DataRetrievalFilters {
  source: string;
  dateRange: string;
  dataType: string;
  limit: string;
}

export default async function DataSourcePage({ params }: DataSourcePageProps) {
  const { orgId } = await params;
  
  return (
    <DataSourceContent orgId={orgId} />
  );
}

function DataSourceContent({ orgId }: { orgId: string }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('sources');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(true);
  const [retrievalFilters, setRetrievalFilters] = useState<DataRetrievalFilters>({
    source: '',
    dateRange: '30',
    dataType: 'all',
    limit: '1000'
  });
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievalResults, setRetrievalResults] = useState<{
    data: any[];
    metadata: any;
  } | null>(null);
  const [availableDataTypes, setAvailableDataTypes] = useState<string[]>(['all']);

  
  const { data: session, isPending } = useSession();
  const { currentOrg } = useAppStore();
  
  // Get user information from session, with fallback
  const userId = session?.user?.email || session?.user?.id || 'anonymous-user';

  // Load integrations on component mount
  useEffect(() => {
    loadIntegrations();
  }, [orgId]);

  // Load available data types when source changes
  useEffect(() => {
    if (retrievalFilters.source && retrievalFilters.source !== '__ALL__') {
      loadAvailableDataTypes();
    } else {
      setAvailableDataTypes(['all', 'transactions', 'appointments', 'contacts', 'invoices']);
    }
  }, [retrievalFilters.source]);

  const loadIntegrations = async () => {
    setIsLoadingIntegrations(true);
    try {
      // Load real integrations from database
      const response = await fetch(`/api/integrations/list?orgId=${orgId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load integrations');
      }

      // Map the integrations to include icons
      const realIntegrations: Integration[] = data.integrations.map((integration: any) => ({
        id: integration.id,
        name: integration.name,
        type: integration.type,
        status: integration.status,
        lastSync: integration.lastSync ? new Date(integration.lastSync) : undefined,
        recordCount: integration.recordCount,
        description: integration.description,
        icon: integration.type === 'google' ? Chrome : 
              integration.type === 'acuity' ? Calendar :
              integration.type === 'plaid' ? CreditCard : Upload
      }));

      // Add mock integrations for types that aren't connected yet
      const connectedTypes = new Set(realIntegrations.map(i => i.type));
      const mockIntegrations: Integration[] = [];

      // Add mock Plaid if not connected
      if (!connectedTypes.has('plaid')) {
        mockIntegrations.push({
          id: 'plaid-mock',
          name: 'Plaid Banking',
          type: 'plaid',
          status: 'disconnected',
          description: 'Connect bank accounts and credit cards',
          icon: CreditCard
        });
      }

      // Add manual uploads option
      mockIntegrations.push({
        id: 'manual-uploads',
        name: 'Manual Uploads',
        type: 'manual',
        status: 'connected',
        lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000),
        recordCount: 0,
        description: 'CSV and Excel file uploads',
        icon: Upload
      });

      // Combine real and mock integrations
      setIntegrations([...realIntegrations, ...mockIntegrations]);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      // Fallback to empty array
      setIntegrations([]);
    } finally {
      setIsLoadingIntegrations(false);
    }
  };

  const loadAvailableDataTypes = async () => {
    try {
      const selectedIntegration = integrations.find(i => i.id === retrievalFilters.source);
      if (!selectedIntegration) return;

      // Map integration types to source names
      const sourceMapping: Record<string, string> = {
        'google': 'google',
        'acuity': 'acuity', 
        'plaid': 'plaid',
        'manual': 'manual'
      };

      const integrationSource = sourceMapping[selectedIntegration.type];
      if (integrationSource) {
        const response = await fetch(`/api/data/retrieve?source=${integrationSource}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableDataTypes(['all', ...data.dataTypes]);
        }
      }
    } catch (error) {
      console.error('Failed to load data types:', error);
      // Fallback to default options
      setAvailableDataTypes(['all', 'transactions', 'appointments', 'contacts', 'invoices']);
    }
  };

  const handleUploadSuccess = (result: any) => {
    console.log('Upload successful:', result);
    setRefreshTrigger(prev => prev + 1);
    loadIntegrations(); // Refresh integration data
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };



  const handleDataRetrieval = async () => {
    if (!retrievalFilters.source) return;
    
    setIsRetrieving(true);
    try {
      // Determine date range
      let dateRange;
      if (retrievalFilters.dateRange !== 'all') {
        const days = parseInt(retrievalFilters.dateRange);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        
        dateRange = {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };
      }

      // Check if retrieving from all sources
      const retrieveFromAll = retrievalFilters.source === '__ALL__';
      let requestBody: any = {
        orgId,
        retrieveFromAll,
        dataTypes: retrievalFilters.dataType === 'all' ? undefined : [retrievalFilters.dataType],
        dateRange,
        limit: retrievalFilters.limit === 'all' ? undefined : parseInt(retrievalFilters.limit)
      };

      if (!retrieveFromAll) {
        // Find the selected integration
        const selectedIntegration = integrations.find(i => i.id === retrievalFilters.source);
        if (!selectedIntegration) {
          throw new Error('Selected integration not found');
        }

        // Determine integration source mapping
        const sourceMapping: Record<string, string> = {
          'google': 'google',
          'acuity': 'acuity', 
          'plaid': 'plaid',
          'manual': 'manual'
        };

        const integrationSource = sourceMapping[selectedIntegration.type];
        if (!integrationSource) {
          throw new Error(`Unsupported integration type: ${selectedIntegration.type}`);

        }

        requestBody.integrationId = retrievalFilters.source;
        requestBody.integrationSource = integrationSource;
      }

      const response = await fetch('/api/data/retrieve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to retrieve data');
      }

      // Update the data imports list
      setRefreshTrigger(prev => prev + 1);
      
      // Format results for display - flatten the data from all sources
      const allRecords = result.data.flatMap((sourceData: any) => 
        sourceData.records.map((record: any) => ({
          ...record,
          _source: sourceData.source,
          _dataType: sourceData.dataType
        }))
      );
      
      // Store the results for display
      const sourceName = retrieveFromAll 
        ? 'All Connected Sources' 
        : integrations.find(i => i.id === retrievalFilters.source)?.name || 'Unknown Source';

      setRetrievalResults({
        data: allRecords,
        metadata: {
          ...result.summary,
          source: sourceName,
          dateRange: retrievalFilters.dateRange,
          dataType: retrievalFilters.dataType,
          recordsRetrieved: result.summary.totalRecords,
          retrievedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Data retrieval error:', error);
      alert(`Failed to retrieve data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRetrieving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  // Show loading state while session is being fetched
  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Data Management</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your data sources, retrieve information from integrations, and upload files
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sources" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Data Sources
            </TabsTrigger>
            <TabsTrigger value="retrieve" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Retrieve Data
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Import History
            </TabsTrigger>
          </TabsList>

          {/* Data Sources Tab */}
          <TabsContent value="sources" className="mt-6 space-y-6">
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Connected Data Sources</h2>
                <Button 
                  onClick={loadIntegrations} 
                  disabled={isLoadingIntegrations}
                  variant="outline" 
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingIntegrations ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {isLoadingIntegrations ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="pb-3">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-8 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {integrations.map((integration) => {
                    const Icon = integration.icon;
                    return (
                      <Card key={integration.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-sm font-medium">{integration.name}</CardTitle>
                                <CardDescription className="text-xs">{integration.description}</CardDescription>
                              </div>
                            </div>
                            {getStatusIcon(integration.status)}
                          </div>
                          <div className="flex items-center justify-between">
                            {getStatusBadge(integration.status)}
                            <span className="text-xs text-muted-foreground">
                              {integration.recordCount} records
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                            <span>Last sync:</span>
                            <span>{integration.lastSync?.toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Settings className="w-3 h-3 mr-1" />
                              Manage
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Add New Source */}
              <Card className="border-2 border-dashed border-border hover:border-border/80 transition-colors">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Cloud className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Add New Data Source</h3>
                  <p className="text-muted-foreground mb-4">Connect integrations or upload files to expand your data sources</p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => window.location.href = `/org/${orgId}/integrations`}>
                      <Cloud className="w-4 h-4 mr-2" />
                      Browse Integrations
                    </Button>
                    <Button onClick={() => setActiveTab('retrieve')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Retrieve Data Tab */}
          <TabsContent value="retrieve" className="mt-6 space-y-6">
            {/* Results Display */}
            {retrievalResults && (
              <DataRetrievalResults
                data={retrievalResults.data}
                metadata={retrievalResults.metadata}
                orgId={orgId}
                onClose={() => setRetrievalResults(null)}
                onExport={(format) => {
                  // TODO: Implement export functionality
                  alert(`Export as ${format} functionality coming soon!`);
                }}
                onSaved={() => {
                  // Refresh the import history when data is saved
                  setRefreshTrigger(prev => prev + 1);
                }}
              />
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Data Retrieval Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Retrieve from Integrations
                  </CardTitle>
                  <CardDescription>
                    Fetch data from your connected integrations with specific filters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Data Source</Label>
                    <Select 
                      value={retrievalFilters.source} 
                      onValueChange={(value) => setRetrievalFilters(prev => ({ ...prev, source: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a data source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select a data source</SelectItem>
                        <SelectItem value="__ALL__">🔄 All Connected Sources</SelectItem>
                        {integrations.filter(i => i.status === 'connected').map(integration => (
                          <SelectItem key={integration.id} value={integration.id}>
                            {integration.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateRange">Date Range</Label>
                      <Select 
                        value={retrievalFilters.dateRange} 
                        onValueChange={(value) => setRetrievalFilters(prev => ({ ...prev, dateRange: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">Last 7 days</SelectItem>
                          <SelectItem value="30">Last 30 days</SelectItem>
                          <SelectItem value="90">Last 90 days</SelectItem>
                          <SelectItem value="365">Last year</SelectItem>
                          <SelectItem value="all">All time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="limit">Record Limit</Label>
                      <Select 
                        value={retrievalFilters.limit} 
                        onValueChange={(value) => setRetrievalFilters(prev => ({ ...prev, limit: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100 records</SelectItem>
                          <SelectItem value="500">500 records</SelectItem>
                          <SelectItem value="1000">1,000 records</SelectItem>
                          <SelectItem value="5000">5,000 records</SelectItem>
                          <SelectItem value="all">All records</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataType">Data Type</Label>
                    <Select 
                      value={retrievalFilters.dataType} 
                      onValueChange={(value) => setRetrievalFilters(prev => ({ ...prev, dataType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDataTypes.map(dataType => (
                          <SelectItem key={dataType} value={dataType}>
                            {dataType === 'all' ? 'All data types' : 
                             dataType.charAt(0).toUpperCase() + dataType.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleDataRetrieval} 
                    disabled={!retrievalFilters.source || isRetrieving}
                    className="w-full"
                  >
                    {isRetrieving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Retrieving Data...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Retrieve Data
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* File Upload Option */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Files
                  </CardTitle>
                  <CardDescription>
                    Upload CSV or Excel files to import your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Upload className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Manual File Upload</p>
                        <p className="text-xs text-muted-foreground">Drag and drop or click to browse files</p>
                      </div>
                    </div>

          <FileUploader
            orgId={orgId}
            userId={userId}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Import History Tab */}
          <TabsContent value="history" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Import History
                </CardTitle>
                <CardDescription>
                  View all your data imports and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
          <DataImportsList 
            orgId={orgId} 
            refreshTrigger={refreshTrigger}
          />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section - Less Invasive */}
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="w-5 h-5 text-primary" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">1. Connect Integrations</h4>
                <p className="text-muted-foreground">Link your accounts like Google Sheets, Acuity, or Plaid to automatically sync data.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">2. Retrieve Data</h4>
                <p className="text-muted-foreground">Pull specific data from your integrations using filters for date ranges and data types.</p>
        </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">3. Upload Files</h4>
                <p className="text-muted-foreground">Upload CSV and Excel files when you need to import data manually or from other sources.</p>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 