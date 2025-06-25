import { TestBetterAuthOrgs } from '@/components/test-better-auth-orgs';

export default function TestOrgsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Better-Auth Organization Testing</h1>
        <TestBetterAuthOrgs />
      </div>
    </div>
  );
} 