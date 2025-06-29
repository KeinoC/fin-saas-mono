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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { PageLayout } from '@/components/layout/page-layout';
import { useToast } from "@/components/ui/toast";

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
    <PageLayout
      title="Data Sources"
      description="Connect your data sources and manage your uploads."
    >
      <DataSourceContent orgId={orgId} />
    </PageLayout>
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
  const { toast } = useToast();
  
  // Get user information from session, with fallback
  const userId = session?.user?.id || 'anonymous';

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
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to retrieve data',
        variant: "destructive"
      });
    } finally {
      setIsRetrieving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default">Connected</Badge>;
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
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>File Uploads</CardTitle>
          <CardDescription>
            Upload your financial statements in CSV or other supported formats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader 
            onUploadSuccess={handleUploadSuccess} 
            onUploadError={handleUploadError} 
            orgId={orgId} 
            userId={userId}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
          <CardDescription>
            Review your past data imports and their status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataImportsList 
            key={refreshTrigger} 
            orgId={orgId} 
            refreshTrigger={refreshTrigger} 
          />
        </CardContent>
      </Card>
      
      {/* Other cards can be added here following the same pattern */}
    </div>
  );
} 