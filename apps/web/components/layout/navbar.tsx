'use client';

import { useAppStore } from '@lib/stores/app-store';
import { OrgSelector } from '@features/org/components/org-selector';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from '@lib/auth-client';
import { 
  BarChart3, 
  Building2, 
  Settings, 
  LogOut, 
  User, 
  Bell,
  Menu,
  X,
  PlusCircle,
  Home,
  CreditCard,
  FileBarChart,
  Users
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function Navbar() {
  const { data: session, isPending } = useSession();
  const { currentOrg } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  // Show a simplified navbar while session is loading or if no user
  if (isPending || !session?.user) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-yellow-700" />
              <span className="ml-2 text-xl font-bold text-gray-800">K-Fin</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Sign In
              </Link>
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
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Logo */}
            <Link href={currentOrg ? `/org/${currentOrg.id}/dashboard` : '/org/select'} className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <BarChart3 className="h-8 w-8 text-yellow-700" />
                <span className="ml-2 text-xl font-bold text-gray-800">K-Fin</span>
              </div>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </button>

            {/* User Menu */}
            <div className="relative flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-yellow-700" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-800">
                    {user.name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
              </div>

              {/* Desktop User Menu */}
              <div className="hidden md:flex items-center space-x-2">
                {currentOrg && currentOrg.userRole === 'admin' && (
                  <Link
                    href={`/org/${currentOrg.id}/settings`}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 pt-4 pb-3">
            {/* Mobile Organization Selector */}
            {currentOrg && (
              <div className="px-3 pb-4 border-b border-gray-200 mb-4">
                <OrgSelector />
              </div>
            )}

            {/* Mobile Navigation */}
            {currentOrg && (
              <div className="space-y-1 mb-4">
                {mobileNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${
                        item.current
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Mobile User Menu */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              {currentOrg && currentOrg.userRole === 'admin' && (
                <Link
                  href={`/org/${currentOrg.id}/settings`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md"
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Link>
              )}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Organization Button (when no org selected) */}
      {!currentOrg && user && pathname !== '/org/select' && (
        <div className="bg-yellow-50 border-t border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="h-5 w-5 text-yellow-700 mr-2" />
                <span className="text-sm text-yellow-800">No organization selected</span>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/org/select"
                  className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
                >
                  Select Organization
                </Link>
                <Link
                  href="/org/create"
                  className="flex items-center gap-1 text-sm bg-yellow-700 text-white px-3 py-1 rounded-md hover:bg-yellow-800"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Organization
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 