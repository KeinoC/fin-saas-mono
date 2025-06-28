'use client';

import { useState } from 'react';
import { useAppStore } from '@lib/stores/app-store';
import { OrgSelector } from '@features/org/components/org-selector';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Settings, 
  CreditCard,
  FileBarChart,
  Users,
  Home,
  Upload,
  ChevronDown,
  ChevronRight,
  Database,
  GitBranch,
  Clock,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function Sidebar() {
  const { currentOrg } = useAppStore();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['data']);

  if (!currentOrg) {
    return null;
  }

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

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
      name: 'Data',
      icon: Database,
      current: pathname.startsWith(`/org/${currentOrg.id}/data`),
      expandable: true,
      expanded: expandedItems.includes('data'),
      children: [
        {
          name: 'Connections',
      href: `/org/${currentOrg.id}/data/uploads`,
      icon: Upload,
      current: pathname.startsWith(`/org/${currentOrg.id}/data`),
        },
        {
          name: 'Rules',
          href: `/org/${currentOrg.id}/data/rules`,
          icon: GitBranch,
          current: pathname.startsWith(`/org/${currentOrg.id}/data/rules`),
          badge: 'Coming Soon',
        },
      ],
    },
    {
      name: 'Budgets',
      href: `/org/${currentOrg.id}/budgets`,
      icon: BarChart3,
      current: pathname === `/org/${currentOrg.id}/budgets`,
      badge: 'Coming Soon',
    },
    {
      name: 'Scenarios',
      href: `/org/${currentOrg.id}/scenarios`,
      icon: FileBarChart,
      current: pathname === `/org/${currentOrg.id}/scenarios`,
      badge: 'Coming Soon',
    },
    {
      name: 'Reports',
      href: `/org/${currentOrg.id}/reports`,
      icon: TrendingUp,
      current: pathname === `/org/${currentOrg.id}/reports`,
      badge: 'Coming Soon',
    },
    {
      name: 'Team',
      href: `/org/${currentOrg.id}/team`,
      icon: Users,
      current: pathname === `/org/${currentOrg.id}/team`,
      badge: 'Coming Soon',
    },
  ];

  return (
    <div className="hidden lg:fixed lg:top-16 lg:bottom-0 lg:left-0 lg:z-40 lg:w-64 lg:bg-card lg:shadow-lg lg:border-r lg:border-border lg:block">
      {/* Organization Selector */}
              <div className="p-4 border-b border-border">
        <OrgSelector />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          
          if (item.expandable) {
            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleExpanded(item.name.toLowerCase())}
                  className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    item.current
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon 
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      item.current ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`} 
                  />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                
                {item.expanded && item.children && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <div key={child.name} className="flex items-center">
                          {child.badge ? (
                            <div className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 cursor-not-allowed">
                              <ChildIcon className="mr-3 flex-shrink-0 h-4 w-4" />
                              <span className="flex-1">{child.name}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {child.badge}
                              </Badge>
                            </div>
                          ) : (
                            <Link
                              href={child.href}
                              className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                                child.current
                                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              <ChildIcon 
                                className={`mr-3 flex-shrink-0 h-4 w-4 ${
                                  child.current ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                                }`} 
                              />
                              {child.name}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <div key={item.name} className="flex items-center">
              {item.badge ? (
                <div className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-400 dark:text-gray-500 cursor-not-allowed w-full">
                  <Icon className="mr-3 flex-shrink-0 h-5 w-5" />
                  <span className="flex-1">{item.name}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {item.badge}
                  </Badge>
                </div>
              ) : (
            <Link
              href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer w-full ${
                item.current
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-r-2 border-yellow-700 dark:border-yellow-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <Icon 
                className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      item.current ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                }`} 
              />
              {item.name}
            </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      {currentOrg.userRole === 'admin' && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Link
            href={`/org/${currentOrg.id}/settings`}
            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              pathname === `/org/${currentOrg.id}/settings`
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Settings 
              className={`mr-3 flex-shrink-0 h-5 w-5 ${
                pathname === `/org/${currentOrg.id}/settings` 
                  ? 'text-yellow-700 dark:text-yellow-300' 
                  : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
              }`} 
            />
            Settings
          </Link>
        </div>
      )}
    </div>
  );
} 