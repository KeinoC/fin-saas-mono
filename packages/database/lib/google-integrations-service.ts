import { prisma } from '../client';
import { GoogleIntegration } from '@prisma/client';
import { encrypt, decrypt } from './encryption';

export interface CreateGoogleIntegrationData {
  orgId: string;
  userId?: string;
  authMethod: 'oauth' | 'service_account';
  name: string;
  email: string;
  scopes: string[];
  
  // OAuth fields
  accessToken?: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  expiryDate?: Date;
  
  // Service Account fields  
  credentials?: object;
}

export class GoogleIntegrationsService {
  
  async create(data: CreateGoogleIntegrationData): Promise<GoogleIntegration> {
    const {
      orgId,
      userId,
      authMethod,
      name,
      email,
      scopes,
      accessToken,
      refreshToken,
      scope,
      tokenType,
      expiryDate,
      credentials
    } = data;

    // Encrypt sensitive credentials
    const encryptedCredentials = credentials ? await encrypt(JSON.stringify(credentials)) : null;
    const encryptedAccessToken = accessToken ? await encrypt(accessToken) : null;
    const encryptedRefreshToken = refreshToken ? await encrypt(refreshToken) : null;

    const integration = await prisma.googleIntegration.create({
      data: {
        orgId,
        userId,
        authMethod,
        name,
        email,
        scopes,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        scope,
        tokenType,
        expiryDate,
        credentials: encryptedCredentials,
      },
    });

    return integration;
  }

  async findById(id: string): Promise<GoogleIntegration | null> {
    return prisma.googleIntegration.findUnique({
      where: { id, isActive: true },
    });
  }

  async findByOrg(orgId: string): Promise<GoogleIntegration[]> {
    return prisma.googleIntegration.findMany({
      where: { 
        orgId,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrgAndMethod(
    orgId: string, 
    authMethod: 'oauth' | 'service_account'
  ): Promise<GoogleIntegration[]> {
    return prisma.googleIntegration.findMany({
      where: { 
        orgId,
        authMethod,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLastUsed(id: string): Promise<GoogleIntegration | null> {
    return prisma.googleIntegration.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async updateTokens(
    id: string, 
    accessToken: string, 
    refreshToken?: string,
    expiryDate?: Date
  ): Promise<GoogleIntegration | null> {
    const encryptedAccessToken = await encrypt(accessToken);
    const encryptedRefreshToken = refreshToken ? await encrypt(refreshToken) : undefined;

    return prisma.googleIntegration.update({
      where: { id },
      data: { 
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiryDate,
      },
    });
  }

  async deactivate(id: string): Promise<GoogleIntegration | null> {
    return prisma.googleIntegration.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.googleIntegration.delete({
      where: { id },
    });
  }

  // Get decrypted credentials for use in Google API calls
  async getDecryptedIntegration(id: string): Promise<any | null> {
    const integration = await this.findById(id);
    if (!integration) return null;

    const decrypted = {
      ...integration,
      accessToken: integration.accessToken ? await decrypt(integration.accessToken) : null,
      refreshToken: integration.refreshToken ? await decrypt(integration.refreshToken) : null,
      credentials: integration.credentials ? JSON.parse(await decrypt(integration.credentials)) : null,
    };

    return decrypted;
  }

  // Check if user has admin access to organization
  async checkAdminAccess(userId: string, orgId: string): Promise<boolean> {
    const orgUser = await prisma.organizationUser.findUnique({
      where: {
        userId_orgId: { userId, orgId }
      }
    });
    
    return orgUser?.role === 'admin';
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

  // Get integrations that user can use (admin integrations for their orgs)
  async getUsableIntegrations(userId: string, orgId: string): Promise<GoogleIntegration[]> {
    const isMember = await this.checkOrgMembership(userId, orgId);
    if (!isMember) return [];

    return this.findByOrg(orgId);
  }
}

export const googleIntegrationsService = new GoogleIntegrationsService(); 