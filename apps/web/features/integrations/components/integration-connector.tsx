'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@lib/stores/app-store';
import { supabase } from 'config';
import { GoogleIntegration } from './google-integration';
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
    status: 'coming_soon',
    isAvailable: false,
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

  // Fetch Google integrations
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

    fetchGoogleIntegrations();
  }, [currentOrg]);

  const handleConnect = async (integrationId: string) => {
    if (!user || !currentOrg) return;

    if (integrationId === 'google') {
      setShowGoogleDetail(true);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Error';
      case 'available':
        return 'Available';
      case 'coming_soon':
        return 'Coming Soon';
      default:
        return 'Disconnected';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'available':
        return 'text-blue-600';
      case 'coming_soon':
        return 'text-amber-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Category sections */}
      <div className="space-y-8">
        {/* Productivity */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productivity & Export</h3>
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
                  getStatusText={getStatusText}
                  getStatusColor={getStatusColor}
                  googleIntegrations={googleIntegrations}
                  setShowGoogleDetail={setShowGoogleDetail}
                  handleDisconnect={handleDisconnect}
                />
              );
            })}
          </div>
        </div>

        {/* Financial */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial & Accounting</h3>
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
                  getStatusText={getStatusText}
                  getStatusColor={getStatusColor}
                  googleIntegrations={googleIntegrations}
                  setShowGoogleDetail={setShowGoogleDetail}
                  handleDisconnect={handleDisconnect}
                />
              );
            })}
          </div>
        </div>

        {/* Business Operations */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Operations</h3>
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
                  getStatusText={getStatusText}
                  getStatusColor={getStatusColor}
                  googleIntegrations={googleIntegrations}
                  setShowGoogleDetail={setShowGoogleDetail}
                  handleDisconnect={handleDisconnect}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Google Integration Detail Modal */}
      {showGoogleDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Google Workspace Integration</h2>
                <button
                  onClick={() => setShowGoogleDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
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
            </div>
          </div>
        </div>
      )}

      {(connectedIntegrations.length > 0 || googleIntegrations.length > 0) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-medium text-green-800">Connected Integrations</h3>
          </div>
          <p className="text-sm text-green-700">
            Your data will be automatically synced from connected services. 
            You can view and manage your financial data in the dashboard.
          </p>
        </div>
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
  getStatusText,
  getStatusColor,
  googleIntegrations,
  setShowGoogleDetail,
  handleDisconnect
}: {
  integration: Integration;
  Icon: React.ComponentType<{ className?: string }>;
  status: string;
  isConnecting: boolean;
  onConnect: (id: string) => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
  googleIntegrations: any[];
  setShowGoogleDetail: (show: boolean) => void;
  handleDisconnect: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{integration.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(status)}
              <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                {getStatusText(status)}
              </span>
              {integration.id === 'google' && googleIntegrations.length > 0 && (
                <span className="text-xs text-gray-500">
                  ({googleIntegrations.length} integration{googleIntegrations.length !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          </div>
        </div>
        {status === 'connected' && (
          <ExternalLink className="w-4 h-4 text-gray-400" />
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">{integration.description}</p>

      {status === 'connected' ? (
        <div className="space-y-3">
          {integration.lastSync && (
            <p className="text-xs text-gray-500">
              Last synced: {new Date(integration.lastSync).toLocaleDateString()}
            </p>
          )}
          {integration.id === 'google' && googleIntegrations.length > 0 && (
            <p className="text-xs text-gray-500">
              Last used: {new Date(Math.max(...googleIntegrations.map(g => new Date(g.lastUsedAt || g.createdAt).getTime()))).toLocaleDateString()}
            </p>
          )}
          <div className="flex gap-2">
            {integration.id === 'google' ? (
              <button
                onClick={() => setShowGoogleDetail(true)}
                className="w-full px-3 py-2 text-sm bg-yellow-700 text-white rounded-lg hover:bg-yellow-800 transition-colors"
              >
                Manage
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleDisconnect(integration.id)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Disconnect
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-yellow-700 text-white rounded-lg hover:bg-yellow-800 transition-colors">
                  Sync Now
                </button>
              </>
            )}
          </div>
        </div>
      ) : status === 'available' ? (
        <button
          onClick={() => onConnect(integration.id)}
          disabled={isConnecting}
                      className="w-full px-4 py-2 bg-yellow-700 text-white rounded-lg hover:bg-yellow-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isConnecting ? 'Connecting...' : integration.id === 'google' ? 'Configure' : 'Connect'}
        </button>
      ) : status === 'coming_soon' ? (
        <div className="w-full px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Coming Soon</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onConnect(integration.id)}
          disabled={isConnecting || !integration.isAvailable}
          className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed transition-colors"
        >
          Not Available
        </button>
      )}
    </div>
  );
} 