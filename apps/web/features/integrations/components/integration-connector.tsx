'use client';

import { useState } from 'react';
import { useAppStore } from '@lib/stores/app-store';
import { supabase } from 'config';
import { 
  CreditCard, 
  Building, 
  Users, 
  Calendar, 
  Dumbbell, 
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

const integrations: Integration[] = [
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Connect your bank accounts and credit cards',
    icon: CreditCard,
    status: 'disconnected',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync your accounting data',
    icon: Building,
    status: 'disconnected',
  },
  {
    id: 'rippling',
    name: 'Rippling',
    description: 'Import payroll and HR data',
    icon: Users,
    status: 'disconnected',
  },
  {
    id: 'adp',
    name: 'ADP',
    description: 'Connect your payroll system',
    icon: Users,
    status: 'disconnected',
  },
  {
    id: 'acuity',
    name: 'Acuity Scheduling',
    description: 'Import appointment and booking data',
    icon: Calendar,
    status: 'disconnected',
  },
  {
    id: 'mindbody',
    name: 'Mindbody',
    description: 'Connect your fitness business data',
    icon: Dumbbell,
    status: 'disconnected',
  },
];

export function IntegrationConnector() {
  const { user, currentOrg } = useAppStore();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);

  const handleConnect = async (integrationId: string) => {
    if (!user || !currentOrg) return;

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
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Integrations</h2>
        <p className="text-gray-600">
          Connect your financial accounts and business tools to sync data automatically.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const status = getIntegrationStatus(integration);
          const isConnecting = connecting === integration.id;

          return (
            <div
              key={integration.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(status)}
                      <span className={`text-sm capitalize ${
                        status === 'connected' ? 'text-green-600' : 
                        status === 'error' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {status}
                      </span>
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Disconnect
                    </button>
                    <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Sync Now
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect(integration.id)}
                  disabled={isConnecting}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {connectedIntegrations.length > 0 && (
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