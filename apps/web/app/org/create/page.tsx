'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@lib/auth-client';
import { authClient } from '@lib/auth-client';
import { useAppStore } from '@lib/stores/app-store';
import { Building2, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

interface CreateOrgForm {
  name: string;
  currency: string;
  plan: string;
}

export default function CreateOrgPage() {
  const { data: session } = useSession();
  const { setCurrentOrg, setOrganizations, organizations } = useAppStore();
  const router = useRouter();
  
  const [formData, setFormData] = useState<CreateOrgForm>({
    name: '',
    currency: 'USD',
    plan: 'free'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !formData.name.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Use better-auth organization API
      const result = await authClient.organization.create({
        name: formData.name.trim(),
        slug: formData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        metadata: {
          subscriptionPlan: formData.plan,
          currency: formData.currency,
        }
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to create organization');
      }

      // Transform the better-auth organization to our app format
      // The structure might be result.data.organization or just result.data
      const organization = result.data?.organization || result.data;
      if (!organization || !organization.id) {
        throw new Error('Invalid organization data returned from server');
      }

      const newOrg = {
        id: organization.id,
        name: organization.name,
        subscriptionPlan: formData.plan,
        currency: formData.currency,
        userRole: 'admin' as const, // Match the creatorRole we set in auth config
      };

      // Update the store
      const updatedOrgs = [...organizations, newOrg];
      setOrganizations(updatedOrgs);
      setCurrentOrg(newOrg);

      // Navigate to dashboard
      router.push(`/org/${newOrg.id}/dashboard`);
    } catch (error: any) {
      console.error('Organization creation error:', error);
      setError(error.message || 'Failed to create organization. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateOrgForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-yellow-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Organization</h1>
          <p className="text-gray-600">Set up your financial analysis workspace</p>
        </div>

        {/* Back Link */}
        <Link 
          href="/org/select"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to organization selection
        </Link>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-600 rounded-md bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Enter organization name"
                required
              />
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-600 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="JPY">JPY - Japanese Yen</option>
              </select>
            </div>

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Subscription Plan
              </label>
              <div className="space-y-3">
                {[
                  { value: 'free', name: 'Free', description: '1 integration, 3 users, basic reports', price: '$0/month' },
                  { value: 'pro', name: 'Pro', description: '5 integrations, 10 users, advanced reports', price: '$29.99/month' },
                  { value: 'enterprise', name: 'Enterprise', description: 'Unlimited integrations and users', price: '$99.99/month' }
                ].map((plan) => (
                  <label
                    key={plan.value}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.plan === plan.value 
                        ? 'border-yellow-500 bg-yellow-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={plan.value}
                      checked={formData.plan === plan.value}
                      onChange={(e) => handleInputChange('plan', e.target.value)}
                      className="mt-1 w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{plan.name}</h3>
                        <span className="text-sm font-medium text-gray-900">{plan.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                    </div>
                    {formData.plan === plan.value && (
                      <Check className="w-5 h-5 text-yellow-600 mt-0.5" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="w-full bg-yellow-700 text-white py-2 px-4 rounded-md hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  Create Organization
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              You will be the admin of this organization and can invite team members later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 