"use client";

import { ArrowLeft, Building2, Users, FileText, BarChart, CreditCard, Settings } from 'lucide-react';
import Link from 'next/link';

interface ComingSoonProps {
  title: string;
  description: string;
  orgId: string;
  icon?: 'budgets' | 'scenarios' | 'reports' | 'team' | 'settings';
}

export function ComingSoon({ title, description, orgId, icon = 'settings' }: ComingSoonProps) {
  const iconMap = {
    budgets: CreditCard,
    scenarios: BarChart,
    reports: FileText,
    team: Users,
    settings: Settings,
  };

  const IconComponent = iconMap[icon];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <IconComponent className="w-12 h-12 text-yellow-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-lg text-gray-600 mb-8">{description}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <Building2 className="w-8 h-8 text-yellow-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600 text-sm">
            We're working hard to bring you this feature. It will be available in an upcoming release.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href={`/org/${orgId}/dashboard`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-yellow-700 hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="text-center">
            <Link
              href={`/org/${orgId}/integrations`}
              className="text-yellow-700 hover:text-yellow-800 text-sm font-medium"
            >
              Or explore Integrations →
            </Link>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          Have feedback or suggestions?{' '}
          <a href="mailto:feedback@k-fin.com" className="text-yellow-700 hover:text-yellow-800">
            Let us know
          </a>
        </div>
      </div>
    </div>
  );
} 