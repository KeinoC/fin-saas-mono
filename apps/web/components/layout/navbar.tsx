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
  Users,
  Globe
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
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-foreground">K-Fin</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {!isHydrated || isPending ? (
                // Show loading state
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
              ) : (
                // Show sign in when not authenticated
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
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
      name: 'Overview',
      href: `/org/${currentOrg.id}/overview`,
      icon: Home,
      current: pathname === `/org/${currentOrg.id}/overview` || pathname === `/org/${currentOrg.id}/dashboard`,
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
            <Link href={currentOrg ? `/org/${currentOrg.id}/overview` : '/org/select'} className="flex items-center cursor-pointer">
              <div className="flex-shrink-0">
                <Globe className="w-8 h-8 text-primary" />
                <span className="ml-2 text-xl font-bold text-foreground">k-fin</span>
              </div>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted cursor-pointer">
              <Bell className="h-5 w-5" />
            </button>

            {/* User Dropdown - Desktop */}
            <div className="hidden lg:block">
              <UserDropdown />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted cursor-pointer"
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
          <div className="lg:hidden border-t border-border pt-4 pb-3">
            {/* Mobile User Info */}
            <div className="px-3 pb-4 border-b border-border mb-4">
              <UserDropdown />
            </div>

            {/* Mobile Organization Selector */}
            {currentOrg && (
              <div className="px-3 pb-4 border-b border-border mb-4">
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
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
        <div className="bg-primary/5 border-t border-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-primary mr-2" />
                <p className="text-sm text-foreground">
                  You haven't selected an organization yet.
                </p>
              </div>
                <Link
                  href="/org/create"
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer"
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