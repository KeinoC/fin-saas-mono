'use client';

import { useState } from 'react';
import { useAppStore } from '@lib/stores/app-store';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function OrgSelector() {
  const { currentOrg, organizations, switchOrganization } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSelectOrg = (orgId: string) => {
    switchOrganization(orgId);
    setIsOpen(false);
    router.push(`/org/${orgId}/dashboard`);
  };

  if (!currentOrg && organizations.length === 0) {
    return (
      <Link
        href="/org/create"
        className="flex items-center gap-2 px-3 py-2 text-sm bg-yellow-700 text-white rounded-md hover:bg-yellow-800 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Organization
      </Link>
    );
  }

  if (!currentOrg && organizations.length > 0) {
    return (
      <Link
        href="/org/select"
        className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <Building2 className="w-4 h-4" />
        Select Organization
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors min-w-[180px]"
      >
        <Building2 className="w-4 h-4 text-gray-500" />
        <span className="flex-1 text-left truncate font-medium text-gray-900">
          {currentOrg?.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Organizations</h3>
              <p className="text-xs text-gray-500 mt-1">Switch between your organizations</p>
            </div>
            
            <div className="py-2 max-h-64 overflow-y-auto">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSelectOrg(org.id)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    currentOrg?.id === org.id ? 'bg-yellow-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      currentOrg?.id === org.id 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {org.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          org.subscriptionPlan === 'free' 
                            ? 'bg-gray-100 text-gray-600'
                            : org.subscriptionPlan === 'pro'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {org.subscriptionPlan}
                        </span>
                        <span className="text-xs text-gray-500 uppercase">
                          {org.currency}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {org.userRole}
                        </span>
                      </div>
                    </div>
                  </div>
                  {currentOrg?.id === org.id && (
                    <Check className="w-4 h-4 text-yellow-600" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-100">
              <Link
                href="/org/create"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Organization
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 