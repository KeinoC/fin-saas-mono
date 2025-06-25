import { ComingSoon } from '@components/layout/coming-soon';
import { FileBarChart } from 'lucide-react';

interface ScenariosPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function ScenariosPage({ params }: ScenariosPageProps) {
  const { orgId } = await params;

  return (
    <ComingSoon
      title="Scenarios"
      description="Model different financial scenarios, run what-if analyses, and compare potential outcomes for strategic planning."
      orgId={orgId}
      icon={FileBarChart}
    />
  );
} 