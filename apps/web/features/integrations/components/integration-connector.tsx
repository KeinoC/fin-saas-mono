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
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'available':
        return <Settings className="w-5 h-5 text-primary" />;
      case 'coming_soon':
        return <Clock className="w-5 h-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-600/10 text-green-500">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'available':
        return <Badge variant="secondary">Available</Badge>;
      case 'coming_soon':
        return <Badge variant="outline">Coming Soon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const integrationCategories = ['Productivity & Export', 'Financial & Accounting', 'Business Management'];
  const groupedIntegrations = integrations.reduce((acc, integration) => {
    const category = integration.category === 'productivity' ? 'Productivity & Export'
                   : integration.category === 'financial' ? 'Financial & Accounting'
                   : 'Business Management';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
      <div className="space-y-8">
      {integrationCategories.map(category => (
        <div key={category}>
          <h2 className="text-xl font-semibold text-foreground mb-4">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(groupedIntegrations[category] || []).map(integration => {
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
      ))}

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
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="font-medium text-green-400">Connected Integrations</h3>
          </div>
            <p className="text-sm text-green-500/80">
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
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start space-x-4 pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
          <Icon className="h-6 w-6 text-primary" />
                  </div>
        <div className="flex-grow">
          <CardTitle className="text-lg text-foreground">{integration.name}</CardTitle>
          <CardDescription>{integration.description}</CardDescription>
              </div>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col justify-between">
        <div>
          {getStatusBadge(status)}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/60">
          <div className="flex justify-between items-center">
              {status === 'connected' ? (
                <Button
                variant="outline"
                  size="sm"
                onClick={() => {
                  if (integration.id === 'google') setShowGoogleDetail(true);
                  if (integration.id === 'acuity' && setShowAcuityDetail) setShowAcuityDetail(true);
                }}
              >
                Configure
                </Button>
            ) : status === 'available' ? (
                <Button
                  size="sm"
                onClick={() => onConnect(integration.id)}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
            ) : (
              <span className="text-sm text-muted-foreground">Unavailable</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 