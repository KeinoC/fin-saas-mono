'use client';

import { authClient, useSession } from '@lib/auth-client';
import { useState } from 'react';

export function TestBetterAuthOrgs() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState('');

  const testCreateOrganization = async () => {
    setLoading(true);
    try {
      console.log('Current session:', session);
      
      if (!session?.user) {
        setResult({ success: false, error: 'No authenticated user found' });
        return;
      }

      const name = orgName.trim() || "Better Auth Test Org";
      const orgData = {
        name,
        slug: (name + "-" + Date.now()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        metadata: {
          subscriptionPlan: "free",
          currency: "USD"
        }
      };

      console.log('Creating organization with data:', orgData);

      const org = await authClient.organization.create(orgData);
      
      console.log('Organization creation result:', org);
      setResult({ success: true, data: org });
    } catch (error: any) {
      console.error('Organization creation error:', error);
      setResult({ success: false, error: error.message, details: error });
    } finally {
      setLoading(false);
    }
  };

  const testListOrganizations = async () => {
    setLoading(true);
    try {
      console.log('Current session:', session);
      
      if (!session?.user) {
        setResult({ success: false, error: 'No authenticated user found' });
        return;
      }

      const orgs = await authClient.organization.list();
      console.log('Organizations list result:', orgs);
      setResult({ success: true, data: orgs });
    } catch (error: any) {
      console.error('Organizations list error:', error);
      setResult({ success: false, error: error.message, details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-component p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Better-Auth Organization Test</h2>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Session Status:</h3>
        <p className="session-status text-sm text-gray-800">
          {session?.user ? `Logged in as: ${session.user.email}` : 'Not logged in'}
        </p>
      </div>
      
      {session?.user && (
        <div className="mb-6 p-4 border-2 border-gray-600 rounded-md bg-gray-50">
          <h3 className="font-semibold mb-3 text-gray-900">Test Organization Creation</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name (optional)
              </label>
              <input
                type="text"
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-600 rounded-md bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Enter organization name or leave blank for default"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank to use default test name</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <button
          onClick={testCreateOrganization}
          disabled={loading || !session?.user}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Test Create Organization'}
        </button>

        <button
          onClick={testListOrganizations}
          disabled={loading || !session?.user}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test List Organizations'}
        </button>

        {result && (
          <div className="mt-4 p-4 border-2 border-gray-600 rounded-md bg-gray-50">
            <h3 className="font-semibold mb-2 text-gray-900">Result:</h3>
            <pre className="text-sm bg-gray-800 text-gray-100 p-3 rounded-md overflow-auto max-h-96 border border-gray-600">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 