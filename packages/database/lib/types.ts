import type { Prisma } from '@prisma/client'

export type OrganizationWithUsers = Prisma.OrganizationGetPayload<{
  include: { orgUsers: true }
}>

export type ScenarioWithVersions = Prisma.ScenarioGetPayload<{
  include: { scenarioVersions: true }
}>

export type DataImportWithOrg = Prisma.DataImportGetPayload<{
  include: { organization: true }
}>

export type NotificationWithOrg = Prisma.NotificationGetPayload<{
  include: { organization: true }
}>

export type AccountWithOrg = Prisma.AccountGetPayload<{
  include: { organization: true }
}>

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