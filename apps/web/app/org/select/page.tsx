'use client';

import { useAppStore } from '@lib/stores/app-store';
import { authClient } from '@lib/auth-client';
import { useSessionSync } from '@hooks/use-session-sync';
import { Building2, Crown, Plus, Key, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OrgSelectPage() {
  const { organizations, switchOrganization, currentOrg, setOrganizations } = useAppStore();
  const { session, isPending, isAuthenticated } = useSessionSync();
  const router = useRouter();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isPending, isAuthenticated, router]);

  useEffect(() => {
    // Only load organizations if authenticated
    if (!isAuthenticated) return;

    // Load organizations from better-auth
    const loadOrganizations = async () => {
      try {
        setIsLoadingOrgs(true);
        const result = await authClient.organization.list();
        
        if (result.error) {
          console.error('Error loading organizations:', result.error);
          setIsLoadingOrgs(false);
          return;
        }

        if (result.data && result.data.length > 0) {
          const formattedOrgs = result.data.map((org: any) => {
            let metadata: any = {};
            try {
              metadata = org.metadata ? JSON.parse(org.metadata) : {};
            } catch (e) {
              console.warn('Failed to parse organization metadata:', e);
            }

            return {
              id: org.id,
              name: org.name,
              subscriptionPlan: (metadata.subscriptionPlan || 'free') as 'free' | 'pro' | 'enterprise',
              currency: metadata.currency || 'USD',
              userRole: 'admin' as const, // For now, assume admin since user created the org
            };
          });

          setOrganizations(formattedOrgs);

          // If user has only one org and no current org selected, auto-select it
          if (formattedOrgs.length === 1 && !currentOrg) {
            switchOrganization(formattedOrgs[0].id);
            router.push(`/org/${formattedOrgs[0].id}/overview`);
            return;
          }
        }
      } catch (error) {
        console.error('Error loading organizations:', error);
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    loadOrganizations();
  }, [isAuthenticated, router, setOrganizations, switchOrganization, currentOrg]);

  // If current org is already selected, redirect to dashboard
  useEffect(() => {
    if (currentOrg && !isLoadingOrgs) {
      router.push(`/org/${currentOrg.id}/overview`);
    }
  }, [currentOrg, router, isLoadingOrgs]);

  const handleSelectOrg = (orgId: string) => {
    switchOrganization(orgId);
    router.push(`/org/${orgId}/overview`);
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setJoinError('');

    try {
      // For now, simulate joining an organization
      // In a real implementation, this would call an API to validate the code
      if (joinCode.toLowerCase() === 'demo123') {
        const newOrg = {
          id: crypto.randomUUID(),
          name: 'Demo Organization',
          subscriptionPlan: 'pro' as 'free' | 'pro' | 'enterprise',
          currency: 'USD',
          userRole: 'editor' as const,
        };

        const updatedOrgs = [...organizations, newOrg];
        setOrganizations(updatedOrgs);
        setShowJoinModal(false);
        setJoinCode('');
        
        // Auto-select the new organization
        switchOrganization(newOrg.id);
        router.push(`/org/${newOrg.id}/overview`);
      } else {
        setJoinError('Invalid invite code. Please check and try again.');
      }
    } catch (error: any) {
      setJoinError(error.message || 'Failed to join organization. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  if (isPending || isLoadingOrgs) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-700 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isPending ? 'Checking authentication...' : 'Loading your organizations...'}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to K-Fin</h1>
          <p className="text-gray-600 mb-8">
            Get started by creating a new organization or joining an existing one.
          </p>
          
          <div className="space-y-4">
            <Link
              href="/org/create"
              className="w-full bg-yellow-700 text-white py-3 px-4 rounded-md hover:bg-yellow-800 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create New Organization
            </Link>
            
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full bg-white border-2 border-gray-600 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Key className="w-5 h-5" />
              Join with Invite Code
            </button>
            
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Waiting for an email invitation?</p>
              <p className="text-sm text-gray-400">Check your inbox and click the invite link</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Organization</h1>
            <p className="text-gray-600">Choose an organization to continue</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <Link
              href="/org/create"
              className="bg-yellow-700 text-white py-2 px-4 rounded-md hover:bg-yellow-800 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Organization
            </Link>
            
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-white border-2 border-gray-600 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
            >
              <Key className="w-4 h-4" />
              Join with Code
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelectOrg(org.id)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left border border-gray-200 hover:border-yellow-400"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-yellow-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{org.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        {org.userRole === 'admin' && <Crown className="w-3 h-3" />}
                        <span className="capitalize">{org.userRole}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Plan</span>
                    <span className="font-medium capitalize">{org.subscriptionPlan}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Currency</span>
                    <span className="font-medium uppercase">{org.currency}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Join by Code Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-yellow-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Join Organization</h2>
                <p className="text-sm text-gray-600">Enter the invite code you received</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border-2 border-gray-600 rounded-md bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 uppercase tracking-wider"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Try: DEMO123</p>
              </div>

              {joinError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{joinError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinCode('');
                    setJoinError('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-800 border-2 border-gray-600 rounded-md bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinByCode}
                  disabled={isJoining || !joinCode.trim()}
                  className="flex-1 bg-yellow-700 text-white px-4 py-2 rounded-md hover:bg-yellow-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isJoining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Organization'
                  )}
                </button>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Don't have an invite code?</p>
                <p className="text-sm text-gray-400">Ask your organization admin to send you an invitation</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 