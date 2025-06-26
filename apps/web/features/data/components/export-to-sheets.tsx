'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { 
  Download, 
  Loader2, 
  ExternalLink, 
  User, 
  Settings, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '@lib/stores/app-store';

interface GoogleIntegration {
  id: string;
  authMethod: 'oauth' | 'service_account';
  name: string;
  email: string;
  scopes: string[];
}

interface ExportToSheetsProps {
  data: any[][];
  defaultFileName?: string;
  onExportComplete?: (spreadsheetUrl: string) => void;
}

export function ExportToSheets({ 
  data, 
  defaultFileName = 'Exported Data', 
  onExportComplete 
}: ExportToSheetsProps) {
  const { currentOrg } = useAppStore();
  const [integrations, setIntegrations] = useState<GoogleIntegration[]>([]);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string>('');
  const [fileName, setFileName] = useState(defaultFileName);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastExportUrl, setLastExportUrl] = useState<string>('');

  // Load available integrations
  useEffect(() => {
    loadIntegrations();
  }, [currentOrg]);

  const loadIntegrations = async () => {
    if (!currentOrg) return;

    setIsLoading(true);
    try {
      // Load all available integrations for this organization
      const response = await fetch(`/api/integrations/google/export-to-sheets?orgId=${currentOrg.id}`);
      const data = await response.json();

      const allIntegrations = data.integrations || [];

      setIntegrations(allIntegrations);
      
      // Auto-select first integration if available
      if (allIntegrations.length > 0) {
        setSelectedIntegrationId(allIntegrations[0].id);
      }
    } catch (error) {
      console.error('Failed to load Google integrations:', error);
      setError('Failed to load Google integrations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedIntegrationId || !data.length) return;

    setIsExporting(true);
    setError('');
    
    try {
      const response = await fetch('/api/integrations/google/export-to-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId: selectedIntegrationId,
          fileName,
          data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Export failed');
      }

      setLastExportUrl(result.spreadsheetUrl);
      onExportComplete?.(result.spreadsheetUrl);
      
      // Show success message
      alert(`✅ Successfully exported to Google Sheets!\nRows exported: ${data.length}`);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const getIntegrationDisplay = (integration: GoogleIntegration) => {
    const authIcon = integration.authMethod === 'oauth' 
      ? <User className="w-3 h-3" />
      : <Settings className="w-3 h-3" />;
      
    const authLabel = integration.authMethod === 'oauth' ? 'OAuth' : 'Service Account';
    
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="font-medium">{integration.name}</span>
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            {authIcon}
            {authLabel}
          </Badge>
        </div>
        <span className="text-sm text-gray-500 truncate ml-2">
          {integration.email}
        </span>
      </div>
    );
  };

  const selectedIntegration = integrations.find(i => i.id === selectedIntegrationId);
  const hasSheetPermissions = selectedIntegration?.scopes.some(scope => 
    scope.includes('spreadsheets') || scope.includes('sheets')
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading Google integrations...</span>
        </CardContent>
      </Card>
    );
  }

  if (integrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export to Google Sheets
          </CardTitle>
          <CardDescription>
            Export your data to Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Google Integration Found</h3>
            <p className="text-gray-600 mb-4">
              You need to connect a Google account or set up a service account to export data to Google Sheets.
            </p>
            <Button onClick={() => window.location.href = `/org/${currentOrg?.id}/integrations`}>
              Set up Google Integration
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export to Google Sheets
        </CardTitle>
        <CardDescription>
          Export {data.length} rows to a new Google Spreadsheet
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="integration-select">Google Integration</Label>
          <Select 
            value={selectedIntegrationId} 
            onValueChange={setSelectedIntegrationId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a Google integration" />
            </SelectTrigger>
            <SelectContent>
              {integrations.map((integration) => (
                <SelectItem key={integration.id} value={integration.id}>
                  {getIntegrationDisplay(integration)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedIntegration && !hasSheetPermissions && (
            <div className="flex items-center gap-2 mt-2 p-3 bg-yellow-50 text-yellow-700 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                This integration may not have Google Sheets permissions. Export might fail.
              </span>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="file-name">Spreadsheet Name</Label>
          <Input
            id="file-name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter spreadsheet name"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {lastExportUrl && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Last export successful!</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(lastExportUrl, '_blank')}
              className="ml-auto"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Open
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleExport}
            disabled={isExporting || !selectedIntegrationId || !fileName.trim() || data.length === 0}
            className="flex-1"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export to Sheets
              </>
            )}
          </Button>
          
          {lastExportUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(lastExportUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>

        {selectedIntegration && (
          <div className="text-xs text-gray-500 space-y-1">
            <p>Using: {selectedIntegration.name} ({selectedIntegration.email})</p>
            <p>Auth method: {selectedIntegration.authMethod === 'oauth' ? 'User OAuth' : 'Service Account'}</p>
            <p>Permissions: {selectedIntegration.scopes.join(', ')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example usage component
export function ExampleExportUsage() {
  const sampleData = [
    ['Date', 'Description', 'Amount', 'Category'],
    ['2024-01-01', 'Sample Transaction 1', '-50.00', 'Food'],
    ['2024-01-02', 'Sample Transaction 2', '-25.00', 'Transport'],
    ['2024-01-03', 'Sample Income', '1000.00', 'Salary'],
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <ExportToSheets 
        data={sampleData}
        defaultFileName="Financial Data Export"
        onExportComplete={(url) => {
          console.log('Export completed:', url);
        }}
      />
    </div>
  );
} 