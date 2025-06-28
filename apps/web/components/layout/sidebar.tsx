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

// Define types for navigation items
type NavItem = {
  name: string;
  href?: string;
  icon: any;
  current: boolean;
  badge?: string;
  expandable?: boolean;
  expanded?: boolean;
  children?: NavItem[];
};

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

  const navigation: NavItem[] = [
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
          current: pathname.startsWith(`/org/${currentOrg.id}/data/uploads`),
        },
        {
          name: 'Categories',
          href: `/org/${currentOrg.id}/data/categories`,
          icon: GitBranch,
          current: pathname.startsWith(`/org/${currentOrg.id}/data/categories`),
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
    {
      name: 'Settings',
      href: `/org/${currentOrg.id}/settings`,
      icon: Settings,
      current: pathname.startsWith(`/org/${currentOrg.id}/settings`),
    }
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
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon 
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      item.current ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
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
                            <div className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground/50 cursor-not-allowed">
                              <ChildIcon className="mr-3 flex-shrink-0 h-4 w-4" />
                              <span className="flex-1">{child.name}</span>
                              <Badge variant="subtle" className="ml-2">
                                {child.badge}
                              </Badge>
                            </div>
                          ) : (
                            <Link
                              href={child.href || '#'}
                              className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                                child.current
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                              }`}
                            >
                              <ChildIcon 
                                className={`mr-3 flex-shrink-0 h-4 w-4 ${
                                  child.current ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
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
                <div className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground/50 cursor-not-allowed w-full">
                  <Icon className="mr-3 flex-shrink-0 h-5 w-5" />
                  <span className="flex-1">{item.name}</span>
                  <Badge variant="subtle" className="ml-2">
                    {item.badge}
                  </Badge>
                </div>
              ) : (
                <Link
                  href={item.href || '#'}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer w-full ${
                    item.current
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon 
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      item.current ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
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
      {/* This is now moved into the main navigation */}
    </div>
  );
} 