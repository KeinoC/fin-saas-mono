'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from 'config';
import { useAppStore } from '@lib/stores/app-store';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser, setOrganizations, setLoading } = useAppStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      setLoading(true);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/login?error=callback_error');
          return;
        }

        if (!session?.user) {
          router.push('/auth/login');
          return;
        }

        // Set user in store
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
        });

        // Fetch user's organizations
        const { data: orgUsers, error: orgError } = await supabase
          .from('org_users')
          .select(`
            role,
            orgs (
              id,
              name,
              subscription_plan,
              currency
            )
          `)
          .eq('user_id', session.user.id);

        if (orgError) {
          console.error('Error fetching organizations:', orgError);
        } else if (orgUsers && orgUsers.length > 0) {
          const organizations = orgUsers.map((ou: any) => ({
            id: ou.orgs.id,
            name: ou.orgs.name,
            subscriptionPlan: ou.orgs.subscription_plan,
            currency: ou.orgs.currency,
            userRole: ou.role,
          }));
          
          setOrganizations(organizations);
          
          // If user has only one org, auto-select it
          if (organizations.length === 1) {
            router.push(`/org/${organizations[0].id}/dashboard`);
          } else {
            router.push('/org/select');
          }
        } else {
          // No organizations found - redirect to onboarding or org creation
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/auth/login?error=unexpected_error');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, setUser, setOrganizations, setLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
} 