'use client';

import { IntegrationConnector } from '@/features/integrations/components/integration-connector';
import { AcuityOAuthIntegration } from '@/features/integrations/components/acuity-oauth-integration';
// import { GoogleIntegrationBetterAuth } from '@/features/integrations/components/google-integration-betterauth';

interface IntegrationsContentProps {
  orgId: string;
}

export function IntegrationsContent({ orgId }: IntegrationsContentProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
            <p className="text-muted-foreground mt-1">Connect your financial accounts and services</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Better Auth Google Integration - Temporarily disabled */}
          {/* <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Google Services</h2>
            <GoogleIntegrationBetterAuth orgId={orgId} />
          </div> */}
          
          {/* Acuity OAuth Integration */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Acuity Scheduling OAuth</h2>
            <AcuityOAuthIntegration orgId={orgId} isAdmin={true} />
          </div>
          
          {/* Other Integrations */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Other Integrations</h2>
            <IntegrationConnector orgId={orgId} />
          </div>
        </div>
      </div>
    </div>
  );
} 