'use client';

import { useSession } from '@lib/auth-client';
import { useAppStore } from '@lib/stores/app-store';
import { Sidebar } from './sidebar';
import { usePathname } from 'next/navigation';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const { data: session, isPending } = useSession();
  const { currentOrg } = useAppStore();
  const pathname = usePathname();

  // Don't show sidebar for auth pages
  const isAuthPage = pathname?.startsWith('/auth/') || pathname === '/';
  
  // Don't show sidebar for org creation/selection pages
  const isOrgManagementPage = pathname?.startsWith('/org/create') || pathname?.startsWith('/org/select');
  
  // Don't show sidebar for profile and test pages
  const isProfilePage = pathname?.startsWith('/profile');
  const isTestPage = pathname?.startsWith('/test-');
  
  // Show sidebar only for organization-specific pages when user is authenticated and has an org
  const isOrgPage = pathname?.includes('/org/') && !isOrgManagementPage;
  
  // Show sidebar only if user is authenticated, has an org, and is on an org-specific page
  const shouldShowSidebar = !isPending && 
                           session?.user && 
                           currentOrg && 
                           isOrgPage && 
                           !isAuthPage && 
                           !isOrgManagementPage && 
                           !isProfilePage && 
                           !isTestPage;

  return (
    <>
      {shouldShowSidebar && <Sidebar />}
      <main className={shouldShowSidebar ? "pt-16 lg:pl-64 min-h-[calc(100vh-4rem)]" : "pt-16 min-h-[calc(100vh-4rem)]"}>
        {children}
      </main>
    </>
  );
} 