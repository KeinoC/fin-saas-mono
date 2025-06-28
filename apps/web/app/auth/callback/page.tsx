'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@lib/auth-client';
import { useAppStore } from '@lib/stores/app-store';
import { Organization } from 'better-auth/plugins';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser, setOrganizations, setCurrentOrg, setLoading } = useAppStore();

  interface OrganizationWithMetadata extends Organization {
    subscriptionPlan: string;
    currency: string;
    userRole: string;
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      setLoading(true);
      
      try {
        // Get session from better-auth
        const sessionResponse = await authClient.getSession();
        
        if (!sessionResponse?.data?.user) {
          router.push('/auth/login');
          return;
        }

        const session = sessionResponse.data;

        // Set user in store
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        });

        // Get user's organizations from better-auth
        const organizationsResponse = await authClient.organization.list();
        const organizations = organizationsResponse?.data || [];
        
        if (organizations && organizations.length > 0) {
          setOrganizations(organizations);
          
          // If user has only one org, auto-select it and redirect to dashboard
          if (organizations.length === 1) {
            setCurrentOrg(organizations[0]);
            router.push(`/org/${organizations[0].id}/dashboard`);
          } else {
            // Multiple orgs - let user choose
            router.push('/org/select');
          }
        } else {
          // No organizations - redirect to org creation
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
  }, [router, setUser, setOrganizations, setCurrentOrg, setLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
} 