import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface Organization {
  id: string;
  name: string;
  subscriptionPlan: 'free' | 'pro' | 'enterprise';
  currency: string;
  userRole: 'admin' | 'editor' | 'viewer';
}

interface AppStore {
  // User state
  user: User | null;
  isLoading: boolean;
  
  // Organization state
  currentOrg: Organization | null;
  organizations: Organization[];
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setCurrentOrg: (org: Organization | null) => void;
  setOrganizations: (orgs: Organization[]) => void;
  switchOrganization: (orgId: string) => void;
  addOrganization: (org: Organization) => void;
  removeOrganization: (orgId: string) => void;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => void;
  
  // Clear all state (logout)
  clearState: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      currentOrg: null,
      organizations: [],
      
      // User actions
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      
      // Organization actions
      setCurrentOrg: (currentOrg) => set({ currentOrg }),
      setOrganizations: (organizations) => set({ organizations }),
      
      switchOrganization: (orgId) => {
        const { organizations } = get();
        const org = organizations.find(o => o.id === orgId);
        if (org) {
          set({ currentOrg: org });
        }
      },
      
      addOrganization: (org) => {
        const { organizations } = get();
        set({ organizations: [...organizations, org] });
      },
      
      removeOrganization: (orgId) => {
        const { organizations, currentOrg } = get();
        const newOrgs = organizations.filter(o => o.id !== orgId);
        set({ 
          organizations: newOrgs,
          currentOrg: currentOrg?.id === orgId ? null : currentOrg
        });
      },
      
      updateOrganization: (orgId, updates) => {
        const { organizations, currentOrg } = get();
        const newOrgs = organizations.map(org => 
          org.id === orgId ? { ...org, ...updates } : org
        );
        set({ 
          organizations: newOrgs,
          currentOrg: currentOrg?.id === orgId ? { ...currentOrg, ...updates } : currentOrg
        });
      },
      
      clearState: () => set({
        user: null,
        isLoading: false,
        currentOrg: null,
        organizations: []
      })
    }),
    {
      name: 'k-fin-app-store',
      partialize: (state) => ({
        user: state.user,
        currentOrg: state.currentOrg,
        organizations: state.organizations
      })
    }
  )
); 