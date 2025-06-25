'use client';

import { useAppStore } from '@lib/stores/app-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { IntegrationConnector } from '@features/integrations/components/integration-connector';

interface IntegrationsContentProps {
  orgId: string;
}

export function IntegrationsContent({ orgId }: IntegrationsContentProps) {
  const { currentOrg } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!currentOrg || currentOrg.id !== orgId) {
      router.push('/org/select');
      return;
    }
  }, [currentOrg, orgId, router]);

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IntegrationConnector />
      </div>
    </div>
  );
} 