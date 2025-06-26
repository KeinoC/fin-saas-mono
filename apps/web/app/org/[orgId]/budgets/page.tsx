import { ComingSoon } from '@components/layout/coming-soon';

interface BudgetsPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function BudgetsPage({ params }: BudgetsPageProps) {
  const { orgId } = await params;

  return (
    <ComingSoon
      title="Budgets"
      description="Create and manage financial budgets, track spending, and monitor budget performance across your organization."
      orgId={orgId}
      icon="budgets"
    />
  );
} 