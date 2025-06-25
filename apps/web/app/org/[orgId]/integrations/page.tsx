import { IntegrationsContent } from './integrations-content';

interface IntegrationsPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function IntegrationsPage({ params }: IntegrationsPageProps) {
  const { orgId } = await params;
  
  return <IntegrationsContent orgId={orgId} />;
} 