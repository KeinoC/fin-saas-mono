'use client';

import { useAppStore } from '@lib/stores/app-store';
import { useSession } from '@lib/auth-client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Settings,
  Plus,
  ArrowUpRight,
  DollarSign
} from 'lucide-react';

interface DashboardPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { orgId } = await params;
  
  return <DashboardContent orgId={orgId} />;
}

function DashboardContent({ orgId }: { orgId: string }) {
  const { data: session } = useSession();
  const { currentOrg, switchOrganization } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }

    // If no current org or org doesn't match URL, redirect to org selection
    if (!currentOrg || currentOrg.id !== orgId) {
      router.push('/org/select');
      return;
    }
  }, [session, currentOrg, orgId, router]);

  if (!session?.user || !currentOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-700"></div>
      </div>
    );
  }

  // Mock data for demo - in real app, this would come from API
  const stats = [
    {
      title: 'Total Revenue',
      value: '$45,231.89',
      change: '+20.1% from last month',
      icon: DollarSign,
      trend: 'up'
    },
    {
      title: 'Active Integrations',
      value: '3',
      change: '+1 new this month',
      icon: BarChart3,
      trend: 'up'
    },
    {
      title: 'Team Members',
      value: '12',
      change: '+2 new this week',
      icon: Users,
      trend: 'up'
    },
    {
      title: 'Budget Utilization',
      value: '73%',
      change: '+5% from last month',
      icon: TrendingUp,
      trend: 'up'
    }
  ];

  const recentActivities = [
    { action: 'Connected Plaid integration', user: 'John Doe', time: '2 hours ago' },
    { action: 'Created new budget scenario', user: 'Jane Smith', time: '4 hours ago' },
    { action: 'Invited new team member', user: 'Mike Johnson', time: '1 day ago' },
    { action: 'Updated QuickBooks sync', user: 'Sarah Wilson', time: '2 days ago' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentOrg.name} Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back! Here's what's happening with your organization.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-white border-2 border-gray-600 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button className="bg-yellow-700 text-white px-4 py-2 rounded-md hover:bg-yellow-800 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Integration
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-yellow-700" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{stat.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => router.push(`/org/${currentOrg.id}/integrations`)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-left"
              >
                <BarChart3 className="w-8 h-8 text-yellow-700 mb-2" />
                <p className="font-medium text-gray-900">Connect Integration</p>
                <p className="text-sm text-gray-600">Add new data sources</p>
              </button>
              
              <button 
                onClick={() => router.push(`/org/${currentOrg.id}/budgets`)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-left"
              >
                <TrendingUp className="w-8 h-8 text-yellow-700 mb-2" />
                <p className="font-medium text-gray-900">Create Budget</p>
                <p className="text-sm text-gray-600">Plan your finances</p>
              </button>
              
              <button 
                onClick={() => router.push(`/org/${currentOrg.id}/scenarios`)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-left"
              >
                <BarChart3 className="w-8 h-8 text-yellow-700 mb-2" />
                <p className="font-medium text-gray-900">New Scenario</p>
                <p className="text-sm text-gray-600">Model different outcomes</p>
              </button>
              
              <button 
                onClick={() => router.push(`/org/${currentOrg.id}/invitations`)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors text-left"
              >
                <Users className="w-8 h-8 text-yellow-700 mb-2" />
                <p className="font-medium text-gray-900">Invite Team</p>
                <p className="text-sm text-gray-600">Add team members</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">by {activity.user}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Organization Info */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Plan</span>
                <span className="text-sm font-medium capitalize">{currentOrg.subscriptionPlan}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Currency</span>
                <span className="text-sm font-medium uppercase">{currentOrg.currency}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Role</span>
                <span className="text-sm font-medium capitalize">{currentOrg.userRole}</span>
              </div>
              <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                Manage Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 