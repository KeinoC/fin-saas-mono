import { ComingSoon } from '@components/layout/coming-soon';

interface ReportsPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { orgId } = await params;

  return (
    <ComingSoon
      title="Reports"
      description="Generate comprehensive financial reports, export data, and create custom dashboards for stakeholder presentations."
      orgId={orgId}
      icon="reports"
    />
  );
} 