'use client';

import { useAppStore } from '@lib/stores/app-store';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function OrgSelector() {
  const { currentOrg, organizations, switchOrganization } = useAppStore();
  const router = useRouter();

  const handleSelectOrg = (orgId: string) => {
    switchOrganization(orgId);
    router.push(`/org/${orgId}/dashboard`);
  };

  if (!currentOrg && organizations.length === 0) {
    return (
      <Button asChild className="w-full">
        <Link href="/org/create" className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Create Organization
      </Link>
      </Button>
    );
  }

  if (!currentOrg && organizations.length > 0) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href="/org/select" className="flex items-center gap-2">
        <Building2 className="w-4 h-4" />
        Select Organization
      </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 w-full justify-between min-w-[180px]"
      >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="flex-1 text-left truncate font-medium">
          {currentOrg?.name}
        </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
          
      <DropdownMenuContent className="w-72" align="start">
        <DropdownMenuLabel>
          <div>
            <h3 className="text-sm font-semibold">Organizations</h3>
            <p className="text-xs text-muted-foreground mt-1">Switch between your organizations</p>
            </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
            
        <div className="max-h-64 overflow-y-auto">
              {organizations.map((org) => (
            <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSelectOrg(org.id)}
              className="flex items-center justify-between p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      currentOrg?.id === org.id 
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                        {org.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          org.subscriptionPlan === 'free' 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            : org.subscriptionPlan === 'pro'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                        }`}>
                          {org.subscriptionPlan}
                        </span>
                    <span className="text-xs text-muted-foreground uppercase">
                          {org.currency}
                        </span>
                    <span className="text-xs text-muted-foreground capitalize">
                          {org.userRole}
                        </span>
                      </div>
                    </div>
                  </div>
                  {currentOrg?.id === org.id && (
                <Check className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  )}
            </DropdownMenuItem>
              ))}
            </div>
            
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
              <Link
                href="/org/create"
            className="flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create New Organization
              </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 