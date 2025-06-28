'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@lib/stores/app-store';
import { supabase } from 'config';
import { GoogleIntegration } from './google-integration';
import { AcuityIntegration } from './acuity-integration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Building, 
  Users, 
  Calendar, 
  Dumbbell, 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Clock,
  Settings,
  Chrome
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'connected' | 'disconnected' | 'error' | 'available' | 'coming_soon';
  lastSync?: string;
  isAvailable?: boolean;
  category?: 'financial' | 'business' | 'productivity';
}

const integrations: Integration[] = [
  {
    id: 'google',
    name: 'Google Workspace',
    description: 'Export data to Google Sheets and manage Google Drive files',
    icon: Chrome,
    status: 'available',
    isAvailable: true,
    category: 'productivity',
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Connect your bank accounts and credit cards',
    icon: CreditCard,
    status: 'available',
    isAvailable: true,
    category: 'financial',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync your accounting data',
    icon: Building,
    status: 'coming_soon',
    isAvailable: false,
    category: 'financial',
  },
  {
    id: 'rippling',
    name: 'Rippling',
    description: 'Import payroll and HR data',
    icon: Users,
    status: 'coming_soon',
    isAvailable: false,
    category: 'business',
  },
  {
    id: 'adp',
    name: 'ADP',
    description: 'Connect your payroll system',
    icon: Users,
    status: 'coming_soon',
    isAvailable: false,
    category: 'business',
  },
  {
    id: 'acuity',
    name: 'Acuity Scheduling',
    description: 'Import appointment and booking data',
    icon: Calendar,
    status: 'available',
    isAvailable: true,
    category: 'business',
  },
  {
    id: 'mindbody',
    name: 'Mindbody',
    description: 'Connect your fitness business data',
    icon: Dumbbell,
    status: 'coming_soon',
    isAvailable: false,
    category: 'business',
  },
];

export function IntegrationConnector({ orgId }: { orgId: string }) {
  const { user, currentOrg } = useAppStore();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);
  const [googleIntegrations, setGoogleIntegrations] = useState<any[]>([]);
  const [showGoogleDetail, setShowGoogleDetail] = useState(false);
  const [acuityIntegration, setAcuityIntegration] = useState<any>(null);
  const [showAcuityDetail, setShowAcuityDetail] = useState(false);

  // Fetch integrations
  useEffect(() => {
    if (!currentOrg) return;
    
    const fetchGoogleIntegrations = async () => {
      try {
        const response = await fetch(`/api/integrations/google/export-to-sheets?orgId=${currentOrg.id}`);
        if (response.ok) {
          const data = await response.json();
          setGoogleIntegrations(data.integrations || []);
        }
      } catch (error) {
        console.error('Failed to fetch Google integrations:', error);
      }
    };

    const fetchAcuityIntegration = async () => {
      try {
        const response = await fetch(`/api/integrations/acuity/test?orgId=${currentOrg.id}`);
        if (response.ok) {
          const data = await response.json();
          setAcuityIntegration(data.integration || null);
        }
      } catch (error) {
        // Integration not found, which is fine
        setAcuityIntegration(null);
      }
    };

    fetchGoogleIntegrations();
    fetchAcuityIntegration();
  }, [currentOrg]);

  const handleConnect = async (integrationId: string) => {
    if (!user || !currentOrg) return;

    if (integrationId === 'google') {
      setShowGoogleDetail(true);
      return;
    }

    if (integrationId === 'acuity') {
      setShowAcuityDetail(true);
      return;
    }

    setConnecting(integrationId);

    try {
      if (integrationId === 'plaid') {
        // Create Plaid link token
        const response = await fetch('/api/plaid/link-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            orgId: currentOrg.id,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // In a real implementation, you would open Plaid Link here
          // For now, we'll simulate a successful connection
          setTimeout(() => {
            setConnectedIntegrations(prev => [...prev, integrationId]);
            setConnecting(null);
          }, 2000);
        } else {
          throw new Error(data.error);
        }
      } else {
        // For other integrations, simulate connection
        setTimeout(() => {
          setConnectedIntegrations(prev => [...prev, integrationId]);
          setConnecting(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Integration connection error:', error);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!currentOrg) return;

    try {
      // Remove from connected integrations
      setConnectedIntegrations(prev => prev.filter(id => id !== integrationId));

      // Remove from database
      await supabase
        .from('accounts')
        .delete()
        .eq('org_id', currentOrg.id)
        .eq('source', integrationId);
    } catch (error) {
      console.error('Integration disconnection error:', error);
    }
  };

  const getIntegrationStatus = (integration: Integration) => {
    if (integration.id === 'google') {
      return googleIntegrations.length > 0 ? 'connected' : 'available';
    }
    if (integration.id === 'acuity') {
      return acuityIntegration ? 'connected' : 'available';
    }
    if (connectedIntegrations.includes(integration.id)) {
      return 'connected';
    }
    return integration.status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'available':
        return <Settings className="w-5 h-5 text-blue-500" />;
      case 'coming_soon':
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'available':
        return <Badge variant="secondary">Available</Badge>;
      case 'coming_soon':
        return <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-400">Coming Soon</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Category sections */}
      <div className="space-y-8">
        {/* Productivity */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Productivity & Export</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {integrations.filter(i => i.category === 'productivity').map((integration) => {
              const Icon = integration.icon;
              const status = getIntegrationStatus(integration);
              const isConnecting = connecting === integration.id;

              return (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  Icon={Icon}
                  status={status}
                  isConnecting={isConnecting}
                  onConnect={handleConnect}
                  getStatusIcon={getStatusIcon}
                  getStatusBadge={getStatusBadge}
                  googleIntegrations={googleIntegrations}
                  setShowGoogleDetail={setShowGoogleDetail}
                  handleDisconnect={handleDisconnect}
                  acuityIntegration={acuityIntegration}
                  setShowAcuityDetail={setShowAcuityDetail}
                />
              );
            })}
          </div>
        </div>

        {/* Financial */}
      <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Financial & Accounting</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {integrations.filter(i => i.category === 'financial').map((integration) => {
              const Icon = integration.icon;
              const status = getIntegrationStatus(integration);
              const isConnecting = connecting === integration.id;

              return (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  Icon={Icon}
                  status={status}
                  isConnecting={isConnecting}
                  onConnect={handleConnect}
                  getStatusIcon={getStatusIcon}
                  getStatusBadge={getStatusBadge}
                  googleIntegrations={googleIntegrations}
                  setShowGoogleDetail={setShowGoogleDetail}
                  handleDisconnect={handleDisconnect}
                  acuityIntegration={acuityIntegration}
                  setShowAcuityDetail={setShowAcuityDetail}
                />
              );
            })}
          </div>
      </div>

        {/* Business Operations */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Business Operations</h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {integrations.filter(i => i.category === 'business').map((integration) => {
          const Icon = integration.icon;
          const status = getIntegrationStatus(integration);
          const isConnecting = connecting === integration.id;

          return (
                <IntegrationCard
              key={integration.id}
                  integration={integration}
                  Icon={Icon}
                  status={status}
                  isConnecting={isConnecting}
                  onConnect={handleConnect}
                  getStatusIcon={getStatusIcon}
                  getStatusBadge={getStatusBadge}
                  googleIntegrations={googleIntegrations}
                  setShowGoogleDetail={setShowGoogleDetail}
                  handleDisconnect={handleDisconnect}
                  acuityIntegration={acuityIntegration}
                  setShowAcuityDetail={setShowAcuityDetail}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Google Integration Detail Modal */}
      {showGoogleDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Google Workspace Integration</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGoogleDetail(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <GoogleIntegration
                integrations={googleIntegrations}
                onRefresh={() => {
                  // Refresh integrations
                  if (currentOrg) {
                    fetch(`/api/integrations/google/export-to-sheets?orgId=${currentOrg.id}`)
                      .then(res => res.json())
                      .then(data => setGoogleIntegrations(data.integrations || []))
                      .catch(console.error);
                  }
                }}
                isAdmin={true} // You might want to check actual admin status here
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Acuity Integration Detail Modal */}
      {showAcuityDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Acuity Scheduling Integration</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAcuityDetail(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <AcuityIntegration
                integration={acuityIntegration}
                onRefresh={() => {
                  // Refresh Acuity integration
                  if (currentOrg) {
                    fetch(`/api/integrations/acuity/test?orgId=${currentOrg.id}`)
                      .then(res => {
                        if (res.ok) {
                          return res.json();
                        }
                        throw new Error('Integration not found');
                      })
                      .then(data => setAcuityIntegration(data.integration || null))
                      .catch(() => setAcuityIntegration(null));
                  }
                }}
                onClose={() => setShowAcuityDetail(false)}
                isAdmin={true} // You might want to check actual admin status here
              />
            </CardContent>
          </Card>
        </div>
      )}

      {(connectedIntegrations.length > 0 || googleIntegrations.length > 0 || acuityIntegration) && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="font-medium text-green-800 dark:text-green-200">Connected Integrations</h3>
          </div>
            <p className="text-sm text-green-700 dark:text-green-300">
            Your data will be automatically synced from connected services. 
            You can view and manage your financial data in the dashboard.
          </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Separate IntegrationCard component for reusability
function IntegrationCard({
  integration,
  Icon,
  status,
  isConnecting,
  onConnect,
  getStatusIcon,
  getStatusBadge,
  googleIntegrations,
  setShowGoogleDetail,
  handleDisconnect,
  acuityIntegration,
  setShowAcuityDetail
}: {
  integration: Integration;
  Icon: React.ComponentType<{ className?: string }>;
  status: string;
  isConnecting: boolean;
  onConnect: (id: string) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
  googleIntegrations: any[];
  setShowGoogleDetail: (show: boolean) => void;
  handleDisconnect: (id: string) => void;
  acuityIntegration?: any;
  setShowAcuityDetail?: (show: boolean) => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
              <CardTitle className="text-sm font-medium">{integration.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(status)}
                {getStatusBadge(status)}
              {integration.id === 'google' && googleIntegrations.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                  ({googleIntegrations.length} integration{googleIntegrations.length !== 1 ? 's' : ''})
                      </span>
              )}
                    </div>
                  </div>
                </div>
                {status === 'connected' && (
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
        <CardDescription className="text-sm">{integration.description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
              {status === 'connected' ? (
                <div className="space-y-3">
                  {integration.lastSync && (
              <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(integration.lastSync).toLocaleDateString()}
                    </p>
                  )}
          {integration.id === 'google' && googleIntegrations.length > 0 && (
              <p className="text-xs text-muted-foreground">
              Last used: {new Date(Math.max(...googleIntegrations.map(g => new Date(g.lastUsedAt || g.createdAt).getTime()))).toLocaleDateString()}
            </p>
          )}
                  <div className="flex gap-2">
            {integration.id === 'google' ? (
                <Button
                onClick={() => setShowGoogleDetail(true)}
                  className="w-full"
                  size="sm"
              >
                Manage
                </Button>
            ) : integration.id === 'acuity' ? (
                <Button
                onClick={() => setShowAcuityDetail?.(true)}
                  className="w-full"
                  size="sm"
              >
                Manage
                </Button>
            ) : (
              <>
                  <Button
                      onClick={() => handleDisconnect(integration.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    >
                      Disconnect
                  </Button>
                  <Button size="sm" className="flex-1">
                      Sync Now
                  </Button>
              </>
            )}
                  </div>
                </div>
      ) : status === 'available' ? (
          <Button
          onClick={() => onConnect(integration.id)}
                  disabled={isConnecting}
            className="w-full"
            size="sm"
                >
          {isConnecting ? 'Connecting...' : integration.id === 'google' ? 'Configure' : 'Connect'}
          </Button>
      ) : status === 'coming_soon' ? (
          <div className="w-full px-4 py-2 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Coming Soon</span>
          </div>
        </div>
      ) : (
          <Button
          onClick={() => onConnect(integration.id)}
          disabled={isConnecting || !integration.isAvailable}
            variant="secondary"
            className="w-full cursor-not-allowed"
            size="sm"
        >
          Not Available
          </Button>
      )}
      </CardContent>
    </Card>
  );
} 