'use client';

import { useAppStore } from '@lib/stores/app-store';
import { OrgSelector } from '@features/org/components/org-selector';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Settings, 
  CreditCard,
  FileBarChart,
  Users,
  Home
} from 'lucide-react';
import Link from 'next/link';

export function Sidebar() {
  const { currentOrg } = useAppStore();
  const pathname = usePathname();

  if (!currentOrg) {
    return null;
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: `/org/${currentOrg.id}/dashboard`,
      icon: Home,
      current: pathname === `/org/${currentOrg.id}/dashboard`,
    },
    {
      name: 'Integrations',
      href: `/org/${currentOrg.id}/integrations`,
      icon: CreditCard,
      current: pathname === `/org/${currentOrg.id}/integrations`,
    },
    {
      name: 'Budgets',
      href: `/org/${currentOrg.id}/budgets`,
      icon: BarChart3,
      current: pathname === `/org/${currentOrg.id}/budgets`,
    },
    {
      name: 'Scenarios',
      href: `/org/${currentOrg.id}/scenarios`,
      icon: FileBarChart,
      current: pathname === `/org/${currentOrg.id}/scenarios`,
    },
    {
      name: 'Reports',
      href: `/org/${currentOrg.id}/reports`,
      icon: FileBarChart,
      current: pathname === `/org/${currentOrg.id}/reports`,
    },
    {
      name: 'Team',
      href: `/org/${currentOrg.id}/team`,
      icon: Users,
      current: pathname === `/org/${currentOrg.id}/team`,
    },
  ];

  return (
    <div className="hidden lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:z-40 lg:w-64 lg:bg-white lg:shadow-lg lg:border-r lg:border-gray-200 lg:block">
      {/* Organization Selector */}
      <div className="p-4 border-b border-gray-200">
        <OrgSelector />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                item.current
                  ? 'bg-yellow-100 text-yellow-800 border-r-2 border-yellow-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon 
                className={`mr-3 flex-shrink-0 h-5 w-5 ${
                  item.current ? 'text-yellow-700' : 'text-gray-400 group-hover:text-gray-600'
                }`} 
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      {currentOrg.userRole === 'admin' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <Link
            href={`/org/${currentOrg.id}/settings`}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              pathname === `/org/${currentOrg.id}/settings`
                ? 'bg-yellow-100 text-yellow-800'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Settings 
              className={`mr-3 flex-shrink-0 h-5 w-5 ${
                pathname === `/org/${currentOrg.id}/settings` 
                  ? 'text-yellow-700' 
                  : 'text-gray-400 group-hover:text-gray-600'
              }`} 
            />
            Settings
          </Link>
        </div>
      )}
    </div>
  );
} 