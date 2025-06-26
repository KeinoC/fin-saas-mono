// Temporary in-memory store for Google integrations
// This will be replaced with proper database storage

export interface StoredGoogleIntegration {
  id: string;
  orgId: string;
  userId: string;
  authMethod: 'oauth' | 'service_account';
  name: string;
  email: string;
  credentials: any;
  scopes: string[];
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
}

class GoogleIntegrationsStore {
  private integrations: Map<string, StoredGoogleIntegration> = new Map();

  create(integration: Omit<StoredGoogleIntegration, 'id' | 'createdAt' | 'isActive'>): StoredGoogleIntegration {
    const id = `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newIntegration: StoredGoogleIntegration = {
      ...integration,
      id,
      isActive: true,
      createdAt: new Date(),
    };
    
    this.integrations.set(id, newIntegration);
    console.log('Created Google integration:', { id, authMethod: integration.authMethod, email: integration.email });
    return newIntegration;
  }

  findById(id: string): StoredGoogleIntegration | undefined {
    return this.integrations.get(id);
  }

  findByOrg(orgId: string): StoredGoogleIntegration[] {
    return Array.from(this.integrations.values())
      .filter(integration => integration.orgId === orgId && integration.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  findByOrgAndMethod(orgId: string, authMethod: 'oauth' | 'service_account'): StoredGoogleIntegration[] {
    return this.findByOrg(orgId)
      .filter(integration => integration.authMethod === authMethod);
  }

  update(id: string, updates: Partial<StoredGoogleIntegration>): StoredGoogleIntegration | undefined {
    const integration = this.integrations.get(id);
    if (!integration) return undefined;

    const updated = { ...integration, ...updates };
    this.integrations.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.integrations.delete(id);
  }

  deactivate(id: string): boolean {
    const integration = this.integrations.get(id);
    if (!integration) return false;

    integration.isActive = false;
    this.integrations.set(id, integration);
    return true;
  }

  // For testing - get all integrations
  getAll(): StoredGoogleIntegration[] {
    return Array.from(this.integrations.values());
  }

  // For testing - clear all integrations
  clear(): void {
    this.integrations.clear();
  }
}

// Export singleton instance
export const googleIntegrationsStore = new GoogleIntegrationsStore(); 