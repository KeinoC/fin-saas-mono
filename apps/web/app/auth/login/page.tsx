'use client';

import { LoginForm } from '@features/auth/components/login-form';
import { BarChart3 } from 'lucide-react';
import { useSession } from '@lib/auth-client';
import { useAppStore } from '@lib/stores/app-store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { data: session, isPending } = useSession();
  const { currentOrg } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check for message in URL params
    const msgParam = searchParams.get('message');
    if (msgParam) {
      setMessage(msgParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (session?.user) {
      // If user is logged in and has an org, redirect to that org's dashboard
      if (currentOrg) {
        router.push(`/org/${currentOrg.id}/overview`);
      } else {
        // If user has no current org selected, go to org selection
        router.push('/org/select');
      }
    }
  }, [session, currentOrg, isPending, router]);

  // Show loading state while checking authentication
  if (isPending) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-yellow-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is authenticated (will redirect)
  if (session?.user) {
    return null;
  }
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <BarChart3 className="h-12 w-12 text-yellow-700" />
              <span className="ml-3 text-3xl font-bold text-gray-800">K-Fin</span>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your financial analysis platform
          </p>
        </div>
        
        {message && (
          <div className="p-3 rounded-lg text-sm bg-green-50 text-green-800 border border-green-200">
            {message}
          </div>
        )}
        
        <LoginForm />
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact{' '}
            <a href="mailto:support@k-fin.com" className="font-medium text-yellow-700 hover:text-yellow-800">
              support@k-fin.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 