'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Chrome, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useSession } from '@/lib/auth-client';

interface GoogleIntegrationProps {
  orgId: string;
}

export function GoogleIntegrationBetterAuth({ orgId }: GoogleIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const handleGoogleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Use Better Auth's built-in Google OAuth
      const response = await authClient.signIn.social({
        provider: "google",
        callbackURL: `/org/${orgId}/integrations?connected=google`
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
      // TODO: Implement disconnect logic when needed
      // For now, we'll handle this through account management
      console.log('Disconnect Google account');
    } catch (err) {
      console.error('Google disconnect error:', err);
      setError('Failed to disconnect Google account.');
    }
  };

  // Check if user has Google account linked
  // This would need to be implemented based on your user account structure
  const isConnected = false; // TODO: Check actual connection status

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
              <Button variant="outline" size="sm">
                Manage Connection
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleGoogleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          )}
        </div>

        {!session && (
          <p className="text-sm text-amber-500 bg-amber-500/10 p-2 rounded">
            Please sign in to connect your Google account.
          </p>
        )}
      </CardContent>
    </Card>
  );
} 