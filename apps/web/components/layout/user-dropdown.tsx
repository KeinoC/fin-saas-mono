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
      <DropdownMenuTrigger className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
        <Avatar className="w-8 h-8">
          <AvatarImage src={user.image || undefined} alt={user.name || user.email || 'User'} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-foreground">
            {user.name || user.email?.split('@')[0]}
          </p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80" align="end">
          {/* User Info Section */}
        <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.image || undefined} alt={user.name || user.email || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
              <div>
              <p className="text-sm font-medium text-foreground">
                  {user.name || user.email?.split('@')[0]}
                </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Organization Switching Section */}
          {organizations.length > 1 && (
          <>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{org.name}</span>
                    </div>
                    {currentOrg?.id === org.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                </DropdownMenuItem>
                ))}
            </div>
            <DropdownMenuSeparator />
          </>
          )}

          {/* Menu Options */}
        <DropdownMenuItem>
            <Link
              href="/profile"
            className="flex items-center space-x-2 cursor-pointer w-full"
            >
              <User className="w-4 h-4 text-muted-foreground" />
              <span>Profile</span>
            </Link>
        </DropdownMenuItem>

            {/* Settings Option (only for admins) */}
            {currentOrg && currentOrg.userRole === 'admin' && (
          <DropdownMenuItem>
              <Link
                href={`/org/${currentOrg.id}/settings`}
              className="flex items-center space-x-2 cursor-pointer w-full"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Organization Settings</span>
              </Link>
          </DropdownMenuItem>
            )}

        <DropdownMenuSeparator />

            {/* Logout Option */}
        <DropdownMenuItem
              onClick={handleLogout}
          className="flex items-center space-x-2 cursor-pointer text-destructive"
            >
          <LogOut className="w-4 h-4" />
              <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 