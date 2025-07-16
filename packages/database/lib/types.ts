import type { Prisma } from '@prisma/client'

export type OrganizationWithUsers = any

export type ScenarioWithVersions = any

export type DataImportWithOrg = any

export type NotificationWithOrg = any

export type AccountWithOrg = any

export interface CreateOrganizationData {
  name: string
  subscriptionPlan?: string
  currency?: string
}

export interface CreateDataImportData {
  orgId: string
  fileType: 'csv' | 'excel'
  data: any
  metadata: any
  createdBy?: string
}

export interface CreateNotificationData {
  orgId: string
  userId: string
  type: string
  message: string
}

export interface CreateAccountData {
  orgId: string
  source: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
  lastSyncedAt?: Date
}

export interface CreateCategoryData {
  orgId: string;
  name: string;
  parentId?: string;
  businessType?: string;
  isSystem?: boolean;
  color?: string;
  taxType?: string;
  taxRate?: number;
  createdBy?: string;
} 