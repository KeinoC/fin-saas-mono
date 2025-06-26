'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';

import { 
  Loader2, 
  ExternalLink, 
  Trash2, 
  User, 
  Settings, 
  Upload,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAppStore } from '@lib/stores/app-store';
import { GoogleAuthMethod, GoogleServiceAccountCredentials } from '@lib/services/google-api';

interface GoogleIntegration {
  id: string;
  authMethod: GoogleAuthMethod;
  name: string;
  email: string;
  scopes: string[];
  lastUsed?: Date;
  createdAt: Date;
}

interface GoogleIntegrationProps {
  integrations: GoogleIntegration[];
  onRefresh: () => void;
  isAdmin?: boolean; // Whether current user is org admin
}

export function GoogleIntegration({ integrations, onRefresh, isAdmin = false }: GoogleIntegrationProps) {
  const { currentOrg } = useAppStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [showServiceAccount, setShowServiceAccount] = useState(false);

  // Service Account form state
  const [serviceAccountForm, setServiceAccountForm] = useState({
    name: '',
    projectId: '',
    privateKey: '',
    clientEmail: '',
    scopes: ['spreadsheets', 'drive_file']
  });
  const [isSubmittingServiceAccount, setIsSubmittingServiceAccount] = useState(false);
  const [serviceAccountError, setServiceAccountError] = useState('');

  // OAuth integration
  const handleOAuthConnect = async () => {
    if (!currentOrg) return;
    
    setIsConnecting(true);
    try {
      const response = await fetch(
        `/api/integrations/google/auth?orgId=${currentOrg.id}&scopes=spreadsheets,drive.file`,
        { method: 'GET' }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 503 && data.details) {
          // Google OAuth not configured
          alert(`Google Integration Setup Required\n\n${data.details}\n\nPlease contact your system administrator to configure Google OAuth credentials.`);
        } else {
          throw new Error(data.error || 'Failed to initiate Google authentication');
        }
        return;
      }
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error: any) {
      console.error('Failed to initiate Google OAuth:', error);
      alert(`Failed to connect to Google: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Service Account integration
  const handleServiceAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !serviceAccountForm.name || !serviceAccountForm.projectId || !serviceAccountForm.privateKey || !serviceAccountForm.clientEmail) {
      setServiceAccountError('Please fill in all required fields');
      return;
    }

    setIsSubmittingServiceAccount(true);
    setServiceAccountError('');

    try {
      // Build credentials object from individual fields
      const credentials: GoogleServiceAccountCredentials = {
        type: 'service_account',
        project_id: serviceAccountForm.projectId,
        private_key_id: `key-${Date.now()}`, // Generate a key ID
        private_key: serviceAccountForm.privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
        client_email: serviceAccountForm.clientEmail,
        client_id: serviceAccountForm.clientEmail.split('@')[0], // Extract client ID from email
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(serviceAccountForm.clientEmail)}`
      };

      const scopeMap = {
        'spreadsheets': 'https://www.googleapis.com/auth/spreadsheets',
        'drive_file': 'https://www.googleapis.com/auth/drive.file',
        'drive_readonly': 'https://www.googleapis.com/auth/drive.readonly',
        'spreadsheets_readonly': 'https://www.googleapis.com/auth/spreadsheets.readonly',
      };

      const scopes = serviceAccountForm.scopes
        .map(scope => scopeMap[scope as keyof typeof scopeMap])
        .filter(Boolean);

      const response = await fetch('/api/integrations/google/service-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: currentOrg.id,
          name: serviceAccountForm.name,
          credentials,
          scopes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to set up service account');
      }

      // Reset form
      setServiceAccountForm({
        name: '',
        projectId: '',
        privateKey: '',
        clientEmail: '',
        scopes: ['spreadsheets', 'drive_file']
      });

      // Refresh integrations
      onRefresh();
      setShowServiceAccount(false);

      alert('✅ Service account integration set up successfully!');
    } catch (error: any) {
      setServiceAccountError(error.message);
    } finally {
      setIsSubmittingServiceAccount(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    setDisconnectingId(integrationId);
    try {
      // Implement disconnect logic
      console.log('Disconnecting integration:', integrationId);
      onRefresh();
    } finally {
      setDisconnectingId(null);
    }
  };



  const getScopeDescription = (scopes: string[]): string => {
    const scopeMap: Record<string, string> = {
      'https://www.googleapis.com/auth/spreadsheets': 'Google Sheets (Read/Write)',
      'https://www.googleapis.com/auth/spreadsheets.readonly': 'Google Sheets (Read Only)',
      'https://www.googleapis.com/auth/drive.file': 'Google Drive (App Files)',
      'https://www.googleapis.com/auth/drive.readonly': 'Google Drive (Read Only)',
      'https://www.googleapis.com/auth/userinfo.email': 'Email',
      'https://www.googleapis.com/auth/userinfo.profile': 'Profile',
    };

    return scopes
      .map(scope => scopeMap[scope] || scope)
      .join(', ');
  };

  const getAuthMethodDisplay = (authMethod: GoogleAuthMethod) => {
    return authMethod === 'oauth' ? 'User OAuth' : 'Service Account';
  };

  const getAuthMethodIcon = (authMethod: GoogleAuthMethod) => {
    return authMethod === 'oauth' ? <User className="w-4 h-4" /> : <Settings className="w-4 h-4" />;
  };

  const oauthIntegrations = integrations.filter(i => i.authMethod === 'oauth');
  const serviceAccountIntegrations = integrations.filter(i => i.authMethod === 'service_account');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c-.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Google Workspace Integration</h2>
            <p className="text-gray-700">Connect with Google Sheets and Drive for seamless data export</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {integrations.length} Connected
          </Badge>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowServiceAccount(!showServiceAccount)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              {showServiceAccount ? 'Hide Advanced' : 'Show Advanced'}
            </Button>
          )}
        </div>
      </div>
      
      {/* Main OAuth Section */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg text-gray-800">Quick Connect with OAuth</CardTitle>
              <CardDescription className="text-gray-600">
                Connect your personal Google account to get started quickly. Perfect for individual use and testing.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleOAuthConnect} 
            disabled={isConnecting}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting to Google...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Connect with Google
              </>
            )}
          </Button>

          {/* Connected Integrations */}
          {integrations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Connected Accounts</h4>
              <div className="space-y-2">
                {integrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    integration={integration}
                    onDisconnect={handleDisconnect}
                    disconnectingId={disconnectingId}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Service Account Section - Conditionally Shown */}
      {showServiceAccount && isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg text-gray-800">Service Account Setup</CardTitle>
                <CardDescription className="text-gray-600">
                  Advanced setup for production environments. Requires service account credentials from Google Cloud Console.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleServiceAccountSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sa-name">Integration Name</Label>
                  <Input
                    id="sa-name"
                    value={serviceAccountForm.name}
                    onChange={(e) => setServiceAccountForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., K-Fin Production Service Account"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sa-project">Google Cloud Project ID</Label>
                  <Input
                    id="sa-project"
                    value={serviceAccountForm.projectId}
                    onChange={(e) => setServiceAccountForm(prev => ({ ...prev, projectId: e.target.value }))}
                    placeholder="your-project-id"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sa-email">Service Account Email</Label>
                <Input
                  id="sa-email"
                  type="email"
                  value={serviceAccountForm.clientEmail}
                  onChange={(e) => setServiceAccountForm(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="service-account@your-project.iam.gserviceaccount.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sa-private-key">Private Key</Label>
                <Textarea
                  id="sa-private-key"
                  value={serviceAccountForm.privateKey}
                  onChange={(e) => setServiceAccountForm(prev => ({ ...prev, privateKey: e.target.value }))}
                  placeholder="-----BEGIN PRIVATE KEY-----
Your private key content here...
-----END PRIVATE KEY-----"
                  rows={6}
                  className="font-mono text-xs"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Copy the private key from your service account JSON file
                </p>
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {[
                    { id: 'spreadsheets', label: 'Google Sheets (Full Access)', description: 'Create, read, and edit spreadsheets' },
                    { id: 'drive_file', label: 'Google Drive (File Access)', description: 'Access files created by this app' },
                    { id: 'spreadsheets_readonly', label: 'Google Sheets (Read Only)', description: 'Read existing spreadsheets only' },
                    { id: 'drive_readonly', label: 'Google Drive (Read Only)', description: 'Read files in Drive' },
                  ].map((scope) => (
                    <label key={scope.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={serviceAccountForm.scopes.includes(scope.id)}
                        onChange={(e) => {
                          setServiceAccountForm(prev => ({
                            ...prev,
                            scopes: e.target.checked
                              ? [...prev.scopes, scope.id]
                              : prev.scopes.filter(s => s !== scope.id)
                          }));
                        }}
                        className="mt-1"
                      />
                      <div>
                        <span className="text-sm font-medium">{scope.label}</span>
                        <p className="text-xs text-gray-500">{scope.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {serviceAccountError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Setup Error</p>
                    <p className="text-sm">{serviceAccountError}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  type="submit" 
                  disabled={isSubmittingServiceAccount || !serviceAccountForm.name || !serviceAccountForm.projectId || !serviceAccountForm.clientEmail || !serviceAccountForm.privateKey}
                  className="flex-1 cursor-pointer"
                >
                {isSubmittingServiceAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up Service Account...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Create Service Account Integration
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowServiceAccount(false)}
                className="flex-1 cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Help Section */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Info className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900 mb-2">Need Help?</h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <p>• <strong>OAuth:</strong> Quick setup for individual use. Uses your personal Google account.</p>
                <p>• <strong>Service Account:</strong> Production-grade setup for automated processes and team access.</p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://console.cloud.google.com/iam-admin/serviceaccounts', '_blank')}
                    className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Google Cloud Console
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://developers.google.com/sheets/api/guides/authorizing', '_blank')}
                    className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    API Documentation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
   );
 }

// Separate component for integration cards
function IntegrationCard({ 
  integration, 
  onDisconnect, 
  disconnectingId 
}: {
  integration: GoogleIntegration;
  onDisconnect: (id: string) => void;
  disconnectingId: string | null;
}) {
  const getScopeDescription = (scopes: string[]): string => {
    const scopeMap: Record<string, string> = {
      'https://www.googleapis.com/auth/spreadsheets': 'Sheets (RW)',
      'https://www.googleapis.com/auth/spreadsheets.readonly': 'Sheets (RO)',
      'https://www.googleapis.com/auth/drive.file': 'Drive (App)',
      'https://www.googleapis.com/auth/drive.readonly': 'Drive (RO)',
      'https://www.googleapis.com/auth/userinfo.email': 'Email',
      'https://www.googleapis.com/auth/userinfo.profile': 'Profile',
    };

    return scopes
      .map(scope => scopeMap[scope] || scope)
      .join(', ');
  };

  const getAuthMethodIcon = (authMethod: GoogleAuthMethod) => {
    return authMethod === 'oauth' ? <User className="w-4 h-4" /> : <Settings className="w-4 h-4" />;
  };

  const getAuthMethodDisplay = (authMethod: GoogleAuthMethod) => {
    return authMethod === 'oauth' ? 'User OAuth' : 'Service Account';
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-800">{integration.name}</span>
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              {getAuthMethodIcon(integration.authMethod)}
              {getAuthMethodDisplay(integration.authMethod)}
            </Badge>
          </div>
          <p className="text-sm text-gray-700 mb-1">
            {integration.email}
          </p>
          <p className="text-xs text-gray-600">
            {getScopeDescription(integration.scopes)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('https://myaccount.google.com/permissions', '_blank')}
          className="cursor-pointer"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Manage
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDisconnect(integration.id)}
          disabled={disconnectingId === integration.id}
          className="cursor-pointer"
        >
          {disconnectingId === integration.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
} 