'use client';

import { useState, useRef, useEffect } from 'react';
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

export function UserDropdown() {
  const { data: session } = useSession();
  const { currentOrg, organizations, switchOrganization } = useAppStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user;

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
    router.push('/auth/login');
  };

  const handleOrgSwitch = (orgId: string) => {
    if (orgId !== currentOrg?.id) {
      switchOrganization(orgId);
      router.push(`/org/${orgId}/dashboard`);
    }
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Card Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-yellow-700" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-800">
            {user.name || user.email?.split('@')[0]}
          </p>
          <p className="text-xs text-gray-600">{user.email}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user.name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Organization Switching Section */}
          {organizations.length > 1 && (
            <div className="py-2 border-b border-gray-100">
              <div className="px-4 py-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Switch Organization
                </p>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrgSwitch(org.id)}
                    className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{org.name}</span>
                    </div>
                    {currentOrg?.id === org.id && (
                      <Check className="w-4 h-4 text-yellow-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Menu Options */}
          <div className="py-2">
            {/* Profile Option */}
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4 text-gray-400" />
              <span>Profile</span>
            </Link>

            {/* Settings Option (only for admins) */}
            {currentOrg && currentOrg.userRole === 'admin' && (
              <Link
                href={`/org/${currentOrg.id}/settings`}
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span>Organization Settings</span>
              </Link>
            )}

            {/* Logout Option */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 