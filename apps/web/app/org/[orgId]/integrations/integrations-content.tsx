'use client';

import { IntegrationConnector } from '@/features/integrations/components/integration-connector';

interface IntegrationsContentProps {
  orgId: string;
}

export function IntegrationsContent({ orgId }: IntegrationsContentProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
            <p className="text-gray-600 mt-1">Connect your financial accounts and services</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IntegrationConnector orgId={orgId} />
      </div>
    </div>
  );
} 