'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@lib/auth-client';
import { useAppStore } from '@lib/stores/app-store';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser, setOrganizations, setCurrentOrg, setLoading, switchOrganization } = useAppStore();


  useEffect(() => {
    const handleAuthCallback = async () => {
      setLoading(true);

      try {
        const sessionResponse = await authClient.getSession();

        if (!sessionResponse?.data?.user) {
          router.push('/auth/login');
          return;
        }

        const session = sessionResponse.data;

        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        });

        const organizationsResponse = await authClient.organization.list();
        const organizations = (organizationsResponse?.data || []).map((org: any) => ({
          id: org.id,
          name: org.name,
          subscriptionPlan: org.metadata?.subscriptionPlan || 'free',
          currency: org.metadata?.currency || 'USD',
          userRole: org.userRole || 'viewer'
        }));
        if (organizations && organizations.length > 0) {
          setOrganizations(organizations);
          if (organizations.length === 1) {
            setCurrentOrg(organizations[0]);
            switchOrganization(organizations[0].id);
            router.push(`/org/${organizations[0].id}/overview`);
          } else {
            router.push('/org/select');
          }
        } else {
          router.push('/org/create');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/auth/login?error=callback_error');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, setUser, setOrganizations, setCurrentOrg, setLoading, switchOrganization]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
}