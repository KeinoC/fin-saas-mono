import { ComingSoon } from '@components/layout/coming-soon';

interface TeamPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { orgId } = await params;

  return (
    <ComingSoon
      title="Team"
      description="Manage team members, set permissions, send invitations, and control access to your organization's financial data."
      orgId={orgId}
      icon="team"
    />
  );
} 