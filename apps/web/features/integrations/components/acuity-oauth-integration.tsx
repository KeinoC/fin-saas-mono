'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { 
  Loader2, 
  ExternalLink, 
  Trash2, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react';
import { useAppStore } from '@lib/stores/app-store';

interface AcuityOAuthIntegration {
  id: string;
  orgId: string;
  userId: string;
  authType: 'oauth';
  displayName: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  scope?: string;
}

interface AcuityOAuthIntegrationProps {
  orgId: string;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export function AcuityOAuthIntegration({ orgId, onRefresh, isAdmin = false }: AcuityOAuthIntegrationProps) {
  const { currentOrg } = useAppStore();
  const { addToast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [integration, setIntegration] = useState<AcuityOAuthIntegration | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrationStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const response = await fetch(`/api/integrations/acuity/oauth/status?orgId=${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setIntegration(data.integration);
      } else if (response.status === 404) {
        setIntegration(null);
      }
    } catch (err) {
      console.error('Failed to fetch Acuity OAuth integration status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchIntegrationStatus();
  }, [orgId]);

  const handleConnect = async () => {
    if (!currentOrg) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Redirect to OAuth authorization
      window.location.href = `/api/integrations/acuity/oauth/authorize?orgId=${orgId}`;
    } catch (error: any) {
      console.error('Failed to initiate Acuity OAuth:', error);
      setError(error.message || 'Failed to connect to Acuity');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentOrg || !integration) return;
    
    const confirmed = confirm('Are you sure you want to disconnect Acuity OAuth? This will remove access to your scheduling data.');
    if (!confirmed) return;

    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/integrations/acuity/oauth/disconnect', {
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
        throw new Error(data.error || 'Failed to disconnect Acuity OAuth');
      }

      setIntegration(null);
      if (onRefresh) onRefresh();
      
      addToast({
        type: 'success',
        title: 'OAuth Integration Disconnected',
        description: 'Acuity OAuth has been successfully disconnected.',
        duration: 4000
      });
    } catch (error: any) {
      console.error('Failed to disconnect Acuity OAuth:', error);
      addToast({
        type: 'error',
        title: 'Disconnection Failed',
        description: error.message || 'Failed to disconnect Acuity OAuth integration.',
        duration: 6000
      });
    } finally {
      setIsDisconnecting(false);
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

  if (isLoadingStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Checking OAuth status...</span>
        </CardContent>
      </Card>
    );
  }

  if (!integration) {
    // No OAuth integration connected
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle>Acuity OAuth 2.0</CardTitle>
            <Badge variant="secondary">
              <AlertCircle className="mr-1 h-3 w-3" />
              Not Connected
            </Badge>
          </div>
          <CardDescription>
            Connect your Acuity account using secure OAuth 2.0 authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">OAuth Benefits:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Secure authorization without sharing passwords</li>
              <li>• Access to full appointments data</li>
              <li>• Automatic token refresh</li>
              <li>• Easy permission management</li>
            </ul>
          </div>
          
          {isAdmin ? (
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect with OAuth 2.0
                </>
              )}
            </Button>
          ) : (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4" />
                <span>Contact an admin to set up Acuity OAuth integration</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // OAuth integration is connected
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle>Acuity OAuth 2.0</CardTitle>
            <Badge variant="default" className="ml-2 bg-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          </div>
        </div>
        <CardDescription>
          Connected as: {integration.displayName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-green-50 p-3 border border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">OAuth 2.0 Connected</span>
          </div>
          <div className="mt-2 text-sm text-green-700">
            <p><strong>Account:</strong> {integration.displayName}</p>
            <p><strong>Connected:</strong> {formatDate(integration.createdAt)}</p>
            {integration.lastSyncedAt && (
              <p><strong>Last used:</strong> {formatDate(integration.lastSyncedAt)}</p>
            )}
            {integration.scope && (
              <p><strong>Permissions:</strong> {integration.scope}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Available features:</p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Fetch appointments data</li>
            <li>• Real-time access to scheduling info</li>
            <li>• Secure token-based authentication</li>
            <li>• Automatic permission management</li>
          </ul>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
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
                  Disconnect OAuth
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}