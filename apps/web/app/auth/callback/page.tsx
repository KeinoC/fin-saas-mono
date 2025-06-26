'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@lib/auth-client';
import { useAppStore } from '@lib/stores/app-store';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser, setOrganizations, setCurrentOrganization, setLoading } = useAppStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      setLoading(true);
      
      try {
        // Get session from better-auth
        const session = await authClient.getSession();
        
        if (!session?.user) {
          router.push('/auth/login');
          return;
        }

        // Set user in store
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        });

        // Get user's organizations from better-auth
        const organizations = await authClient.organization.list();
        
        if (organizations && organizations.length > 0) {
          setOrganizations(organizations);
          
          // If user has only one org, auto-select it and redirect to dashboard
          if (organizations.length === 1) {
            setCurrentOrganization(organizations[0]);
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
  }, [router, setUser, setOrganizations, setCurrentOrganization, setLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
} 