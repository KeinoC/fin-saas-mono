'use client';

import { useAppStore } from '@lib/stores/app-store';
import { useSession, signOut } from '@lib/auth-client';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Building2,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';

export function UserDropdown() {
  const { data: session, isPending } = useSession();
  const { currentOrg, organizations, switchOrganization } = useAppStore();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  const user = session?.user;

  // Ensure client-side hydration is complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const handleOrgSwitch = (orgId: string) => {
    if (orgId !== currentOrg?.id) {
      switchOrganization(orgId);
      router.push(`/org/${orgId}/dashboard`);
    }
    };

  // Don't render anything while hydrating, session is loading, or if no user
  if (!isHydrated || isPending || !user) return null;

  const userInitials = user.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() 
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user.image || undefined} alt={user.name || user.email || 'User'} />
          <AvatarFallback className="bg-yellow-100 text-yellow-700 text-sm font-medium">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {user.name || user.email?.split('@')[0]}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 transition-transform" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80" align="end">
          {/* User Info Section */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.image || undefined} alt={user.name || user.email || 'User'} />
              <AvatarFallback className="bg-yellow-100 text-yellow-700 text-lg font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
              <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.name || user.email?.split('@')[0]}
                </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Organization Switching Section */}
          {organizations.length > 1 && (
          <>
            <DropdownMenuLabel className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Switch Organization
            </DropdownMenuLabel>
              <div className="max-h-32 overflow-y-auto">
                {organizations.map((org) => (
                <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleOrgSwitch(org.id)}
                  className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{org.name}</span>
                    </div>
                    {currentOrg?.id === org.id && (
                      <Check className="w-4 h-4 text-yellow-600" />
                    )}
                </DropdownMenuItem>
                ))}
            </div>
            <DropdownMenuSeparator />
          </>
          )}

          {/* Menu Options */}
        <DropdownMenuItem asChild>
            <Link
              href="/profile"
            className="flex items-center space-x-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-gray-400" />
              <span>Profile</span>
            </Link>
        </DropdownMenuItem>

            {/* Settings Option (only for admins) */}
            {currentOrg && currentOrg.userRole === 'admin' && (
          <DropdownMenuItem asChild>
              <Link
                href={`/org/${currentOrg.id}/settings`}
              className="flex items-center space-x-2 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span>Organization Settings</span>
              </Link>
          </DropdownMenuItem>
            )}

        <DropdownMenuSeparator />

            {/* Logout Option */}
        <DropdownMenuItem
              onClick={handleLogout}
          className="flex items-center space-x-2 cursor-pointer text-red-600 dark:text-red-400"
            >
          <LogOut className="w-4 h-4" />
              <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 