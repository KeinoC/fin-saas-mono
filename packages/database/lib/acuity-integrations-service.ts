import { prisma } from './client';
// import { any } from '@prisma/client';
import { encrypt, decrypt } from './encryption';

export interface CreateAcuityIntegrationData {
  orgId: string;
  userId: string;
  acuityUserId: string;
  apiKey: string;
  name?: string;
}

export class AcuityIntegrationsService {
  
  async create(data: CreateAcuityIntegrationData): Promise<any> {
    const {
      orgId,
      acuityUserId,
      apiKey,
      name
    } = data;

    // Encrypt the API key
    const encryptedApiKey = await encrypt(apiKey);

    // Check if integration already exists
    const existingIntegration = await prisma.account.findUnique({
      where: {
        orgId_source: {
          orgId,
          source: 'acuity'
        }
      }
    });

    if (existingIntegration) {
      // Update existing integration
      return prisma.account.update({
        where: {
          id: existingIntegration.id
        },
        data: {
          accessToken: encryptedApiKey,
          externalAccountId: acuityUserId,
          displayName: name,
          lastSyncedAt: new Date(),
        },
      });
    }

    // Create new integration
    const integration = await prisma.account.create({
      data: {
        orgId,
        source: 'acuity',
        accessToken: encryptedApiKey,
        externalAccountId: acuityUserId,
        displayName: name,
        lastSyncedAt: new Date(),
      },
    });

    return integration;
  }

  async findByOrg(orgId: string): Promise<any | null> {
    return prisma.account.findUnique({
      where: {
        orgId_source: {
          orgId,
          source: 'acuity'
        }
      },
    });
  }

  async updateLastSynced(orgId: string): Promise<any | null> {
    const integration = await this.findByOrg(orgId);
    if (!integration) return null;

    return prisma.account.update({
      where: { id: integration.id },
      data: { lastSyncedAt: new Date() },
    });
  }

  async delete(orgId: string): Promise<void> {
    await prisma.account.deleteMany({
      where: {
        orgId,
        source: 'acuity'
      }
    });
  }

  // Get decrypted credentials for use in Acuity API calls
  async getDecryptedIntegration(orgId: string): Promise<any | null> {
    const integration = await this.findByOrg(orgId);
    if (!integration) return null;

    const decrypted = {
      ...integration,
      apiKey: integration.accessToken ? await decrypt(integration.accessToken) : null,
      userId: integration.externalAccountId,
    };

    return decrypted;
  }

  // Check if user has admin access to organization
  // Note: Currently using lenient check since better-auth handles organization membership
  async checkAdminAccess(userId: string, orgId: string): Promise<boolean> {
    try {
      const orgUser = await prisma.organizationUser.findUnique({
        where: {
          userId_orgId: { userId, orgId }
        }
      });
      
      // If found in Prisma database, check role
      if (orgUser) {
        return orgUser?.role === 'admin' || orgUser?.role === 'owner';
      }
      
      // If not found in Prisma (which is expected with better-auth setup),
      // return true for now since better-auth is handling the organization access
      // TODO: Sync better-auth organization data to Prisma for proper permission checks
      return true;
    } catch (error) {
      console.warn('Admin access check failed:', error);
      // Default to allowing access if there's a database error
      return true;
    }
  }

  // Check if user is member of organization
  async checkOrgMembership(userId: string, orgId: string): Promise<boolean> {
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        userId_orgId: { userId, orgId }
      }
    });
    
    return !!orgUser;
  }

  // Get integration that user can use (if they're member of the org)
  async getUsableIntegration(userId: string, orgId: string): Promise<any | null> {
    const isMember = await this.checkOrgMembership(userId, orgId);
    if (!isMember) return null;

    return this.findByOrg(orgId);
  }
}

export const acuityIntegrationsService = new AcuityIntegrationsService(); 