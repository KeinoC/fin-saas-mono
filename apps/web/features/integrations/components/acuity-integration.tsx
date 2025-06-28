'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useToast } from '../../../components/ui/toast';

import { 
  Loader2, 
  ExternalLink, 
  Trash2, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAppStore } from '@lib/stores/app-store';

interface AcuityIntegration {
  id: string;
  orgId: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  name?: string;
}

interface AcuityIntegrationProps {
  integration: AcuityIntegration | null;
  onRefresh: () => void;
  onClose?: () => void;
  isAdmin?: boolean;
}

export function AcuityIntegration({ integration, onRefresh, onClose, isAdmin = false }: AcuityIntegrationProps) {
  const { currentOrg } = useAppStore();
  const { addToast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [acuityUserId, setAcuityUserId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const handleConnect = async () => {
    if (!currentOrg) return;
    
    if (!acuityUserId.trim() || !apiKey.trim()) {
      setError('Both User ID and API Key are required');
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/integrations/acuity/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orgId: currentOrg.id, 
          acuityUserId: acuityUserId.trim(), 
          apiKey: apiKey.trim() 
        }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If response is not JSON (like an HTML error page), use status text
        data = { error: `Server error: ${response.statusText || 'Unknown error'}` };
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect');
      }
      
      setShowConnectForm(false);
      setAcuityUserId('');
      setApiKey('');
      onRefresh();
      
      addToast({
        type: 'success',
        title: 'Integration Connected!',
        description: 'Acuity Scheduling has been successfully connected to your organization.',
        duration: 4000
      });

      // Auto-close modal and return to integrations list after short delay
      if (onClose) {
        setTimeout(() => {
          addToast({
            type: 'info',
            title: 'Returning to Integrations',
            description: 'Taking you back to the integrations page...',
            duration: 2000
          });
          setTimeout(() => {
            onClose();
          }, 500);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Failed to connect Acuity:', error);
      setError(error.message || 'Failed to connect to Acuity');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentOrg || !integration) return;
    
    const confirmed = confirm('Are you sure you want to disconnect Acuity? This will remove access to your scheduling data.');
    if (!confirmed) return;

    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/integrations/acuity/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orgId: currentOrg.id }),
      });
      
      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          data = { error: `Server error: ${response.statusText || 'Unknown error'}` };
        }
        throw new Error(data.error || 'Failed to disconnect Acuity');
      }

      onRefresh();
      
      addToast({
        type: 'success',
        title: 'Integration Disconnected',
        description: 'Acuity Scheduling has been successfully disconnected.',
        duration: 4000
      });
          } catch (error: any) {
        console.error('Failed to disconnect Acuity:', error);
        addToast({
          type: 'error',
          title: 'Disconnection Failed',
          description: error.message || 'Failed to disconnect Acuity integration.',
          duration: 6000
        });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!currentOrg) return;

    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(
        `/api/integrations/acuity/test?orgId=${currentOrg.id}`,
        { method: 'GET' }
      );
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If response is not JSON (like an HTML error page), use status text
        data = { error: `Server error: ${response.statusText || 'Unknown error'}` };
      }
      setTestResult(data);
      
      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Connection Test Successful!',
          description: 'Your Acuity integration is working properly.',
          duration: 4000
        });
        onRefresh(); // Refresh to update last synced time
      } else {
        addToast({
          type: 'error',
          title: 'Connection Test Failed',
          description: data.error || 'Unable to connect to Acuity.',
          duration: 6000
        });
      }
    } catch (error: any) {
      console.error('Failed to test Acuity connection:', error);
      setTestResult({ error: error.message });
      addToast({
        type: 'error',
        title: 'Test Connection Failed',
        description: error.message || 'Unable to test Acuity connection.',
        duration: 6000
      });
    } finally {
      setIsTesting(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!integration) {
    // No integration connected
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Acuity Scheduling</CardTitle>
          </div>
          <CardDescription>
            Connect your Acuity Scheduling account using your User ID and API Key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Not connected</span>
          </div>
          
          {isAdmin ? (
            <>
              {!showConnectForm ? (
                <Button 
                  onClick={() => setShowConnectForm(true)} 
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Acuity Scheduling
                </Button>
              ) : (
                <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                  <div>
                    <Label htmlFor="acuity-user-id">Acuity User ID</Label>
                    <Input
                      id="acuity-user-id"
                      type="text"
                      value={acuityUserId}
                      onChange={(e) => setAcuityUserId(e.target.value)}
                      placeholder="Enter your numeric User ID from Acuity"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="acuity-api-key">API Key</Label>
                    <Input
                      id="acuity-api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API Key from Acuity"
                      className="mt-1"
                    />
                  </div>
                  <div className="text-xs text-gray-600">
                    <p><strong>To find your credentials:</strong></p>
                    <ol className="list-decimal ml-4 mt-1">
                      <li>Log in to your Acuity Scheduling account</li>
                      <li>Go to Business Settings → Integrations</li>
                      <li>Find your User ID and API Key in the API section</li>
                    </ol>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleConnect} 
                      disabled={isConnecting}
                      size="sm"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowConnectForm(false);
                        setError(null);
                        setAcuityUserId('');
                        setApiKey('');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4" />
                <span>Contact an admin to set up Acuity integration</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Integration is connected
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Acuity Scheduling</CardTitle>
            <Badge variant="default" className="ml-2">
              <CheckCircle className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          </div>
        </div>
        <CardDescription>
          {integration.name && <span>Connected as: {integration.name}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Connected:</span>
            <div className="font-medium">{formatDate(integration.createdAt)}</div>
          </div>
          {integration.lastSyncedAt && (
            <div>
              <span className="text-muted-foreground">Last synced:</span>
              <div className="font-medium">{formatDate(integration.lastSyncedAt)}</div>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Button 
              onClick={handleTestConnection}
              disabled={isTesting}
              variant="outline"
              size="sm"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
            
            <Button 
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              variant="destructive"
              size="sm"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Disconnect
                </>
              )}
            </Button>
          </div>
        )}

        {testResult && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm">
              <strong>Test Result:</strong>
              {testResult.success ? (
                <span className="text-green-600 ml-2">✅ Connection successful</span>
              ) : (
                <span className="text-red-600 ml-2">❌ {testResult.error}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 