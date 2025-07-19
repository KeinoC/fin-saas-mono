'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Chrome, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useSession } from '@/lib/auth-client';

interface GoogleIntegrationProps {
  orgId: string;
}

interface GoogleIntegrationStatus {
  isConnected: boolean;
  integration: {
    id: string;
    name: string;
    email: string;
    connectedAt: string;
    lastUsedAt: string | null;
    scopes: string[];
  } | null;
}

export function GoogleIntegrationBetterAuth({ orgId }: GoogleIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<GoogleIntegrationStatus>({ isConnected: false, integration: null });
  const { data: session } = useSession();

  const fetchGoogleStatus = async () => {
    if (!session?.user) return;
    
    try {
      setIsLoadingStatus(true);
      const response = await fetch(`/api/integrations/google/status?orgId=${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch Google integration status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchGoogleStatus();
  }, [session, orgId]);

  const handleGoogleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Use Better Auth's built-in Google OAuth with organization context
      const response = await authClient.signIn.social({
        provider: "google",
        callbackURL: `/api/integrations/google/callback?orgId=${orgId}`
      });
      
      // Better Auth returns a redirect URL, so we need to redirect manually
      if (response && 'url' in response && response.url) {
        window.location.href = response.url as string;
      }
    } catch (err) {
      console.error('Google connection error:', err);
      setError('Failed to connect to Google. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      setError(null);
      
      const response = await fetch('/api/integrations/google/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orgId }),
      });

      if (response.ok) {
        setStatus({ isConnected: false, integration: null });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to disconnect Google account.');
      }
    } catch (err) {
      console.error('Google disconnect error:', err);
      setError('Failed to disconnect Google account.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = status.isConnected;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Chrome className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg text-foreground">Google Integration</CardTitle>
            <CardDescription>
              Connect your Google account to export data to Google Sheets
            </CardDescription>
          </div>
        </div>
        <div className="ml-auto">
          {isConnected ? (
            <Badge variant="default" className="bg-green-600/10 text-green-500">
              <CheckCircle className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center space-x-2 rounded-md bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {isLoadingStatus ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Checking connection status...</span>
          </div>
        ) : (
          <>
            {isConnected && status.integration ? (
              <div className="space-y-3">
                <div className="rounded-md bg-green-50 p-3 border border-green-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Connected to Google</span>
                  </div>
                  <div className="mt-2 text-sm text-green-700">
                    <p><strong>Account:</strong> {status.integration.email}</p>
                    <p><strong>Connected:</strong> {new Date(status.integration.connectedAt).toLocaleDateString()}</p>
                    {status.integration.lastUsedAt && (
                      <p><strong>Last used:</strong> {new Date(status.integration.lastUsedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Available features:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Export financial data to Google Sheets</li>
                    <li>• Create automated reports</li>
                    <li>• Share data with team members</li>
                    <li>• Access Google Drive for file storage</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Connecting your Google account will allow you to:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Export financial data to Google Sheets</li>
                  <li>• Create automated reports</li>
                  <li>• Share data with team members</li>
                  <li>• Access Google Drive for file storage</li>
                </ul>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              {!isConnected ? (
                <Button
                  onClick={handleGoogleConnect}
                  disabled={isConnecting || !session}
                  className="w-full sm:w-auto"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Chrome className="mr-2 h-4 w-4" />
                      Connect Google Account
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchGoogleStatus}
                    disabled={isLoadingStatus}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Status
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleGoogleDisconnect}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      'Disconnect'
                    )}
                  </Button>
                </div>
              )}
            </div>

            {!session && (
              <p className="text-sm text-amber-500 bg-amber-500/10 p-2 rounded">
                Please sign in to connect your Google account.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 