'use client';

import { useAppStore } from '@lib/stores/app-store';
import { OrgSelector } from '@features/org/components/org-selector';
import { UserDropdown } from './user-dropdown';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@lib/auth-client';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { 
  BarChart3, 
  Building2, 
  Bell,
  Menu,
  X,
  PlusCircle,
  Home,
  CreditCard,
  FileBarChart,
  Users
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export function Navbar() {
  const { data: session, isPending } = useSession();
  const { currentOrg } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Ensure client-side hydration is complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Show a simplified navbar while hydrating, session is loading, or if no user
  if (!isHydrated || isPending || !session?.user) {
    return (
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-yellow-700 dark:text-yellow-400" />
              <span className="ml-2 text-xl font-bold text-gray-800 dark:text-gray-100">K-Fin</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {!isHydrated || isPending ? (
                // Show loading state
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              ) : (
                // Show sign in when not authenticated
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 cursor-pointer"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const user = session.user;

  // Mobile navigation for current org
  const mobileNavigation = currentOrg ? [
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
  ] : [];

  return (
    <nav className="bg-card shadow-sm border-b border-border fixed top-0 left-0 right-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Logo */}
            <Link href={currentOrg ? `/org/${currentOrg.id}/dashboard` : '/org/select'} className="flex items-center cursor-pointer">
              <div className="flex-shrink-0 flex items-center">
                <BarChart3 className="h-8 w-8 text-yellow-700 dark:text-yellow-400" />
                <span className="ml-2 text-xl font-bold text-gray-800 dark:text-gray-100">K-Fin</span>
              </div>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
              <Bell className="h-5 w-5" />
            </button>

            {/* User Dropdown - Desktop */}
            <div className="hidden lg:block">
              <UserDropdown />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 pt-4 pb-3">
            {/* Mobile User Info */}
            <div className="px-3 pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
              <UserDropdown />
            </div>

            {/* Mobile Organization Selector */}
            {currentOrg && (
              <div className="px-3 pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
                <OrgSelector />
              </div>
            )}

            {/* Mobile Navigation */}
            {currentOrg && (
              <div className="space-y-1">
                {mobileNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                        item.current
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Organization Button (when no org selected) */}
      {!currentOrg && user && pathname !== '/org/select' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You haven't selected an organization yet.
                </p>
              </div>
                <Link
                  href="/org/create"
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 cursor-pointer"
                >
                <PlusCircle className="h-3 w-3 mr-1" />
                  Create Organization
                </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 