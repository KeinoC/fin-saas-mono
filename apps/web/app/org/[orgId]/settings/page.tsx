import { ComingSoon } from '@components/layout/coming-soon';

interface SettingsPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { orgId } = await params;

  return (
    <ComingSoon
      title="Settings"
      description="Configure organization settings, manage billing, update preferences, and customize your financial analysis platform."
      orgId={orgId}
      icon="settings"
    />
  );
} 