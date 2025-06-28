import { authLocal } from '../apps/web/lib/auth-local';
import { prisma } from '../packages/database';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

interface SeedUser {
  email: string;
  password: string;
  name: string;
  organizations: {
    name: string;
    currency: string;
    subscriptionPlan: string;
    role: 'owner' | 'admin' | 'editor' | 'viewer';
    dataImports?: {
      filename: string;
      data: any[];
      fileType: 'csv' | 'excel';
    }[];
  }[];
}

const seedUsers: SeedUser[] = [
  {
    email: 'keino.chichester@gmail.com',
    password: 'password123',
    name: 'Keino Chichester',
    organizations: [
      {
        name: 'Acme Corporation',
        currency: 'USD',
        subscriptionPlan: 'pro',
        role: 'owner',
        dataImports: [
          {
            filename: 'financial-data-q1.csv',
            fileType: 'csv',
            data: [
              {
                'Account Name': 'Checking Account',
                'Category': 'Income',
                'Amount': '5000.00',
                'Date': '2024-01-01',
                'Description': 'January Salary'
              },
              {
                'Account Name': 'Credit Card',
                'Category': 'Expense',
                'Amount': '-250.00',
                'Date': '2024-01-02',
                'Description': 'Groceries - Whole Foods'
              },
              {
                'Account Name': 'Savings Account',
                'Category': 'Transfer',
                'Amount': '1000.00',
                'Date': '2024-01-03',
                'Description': 'Monthly savings transfer'
              },
              {
                'Account Name': 'Checking Account',
                'Category': 'Expense',
                'Amount': '-150.00',
                'Date': '2024-01-04',
                'Description': 'Electricity bill'
              },
              {
                'Account Name': 'Checking Account',
                'Category': 'Expense',
                'Amount': '-75.50',
                'Date': '2024-01-05',
                'Description': 'Gas station'
              },
              {
                'Account Name': 'Credit Card',
                'Category': 'Expense',
                'Amount': '-89.99',
                'Date': '2024-01-06',
                'Description': 'Internet bill'
              },
              {
                'Account Name': 'Checking Account',
                'Category': 'Income',
                'Amount': '1200.00',
                'Date': '2024-01-07',
                'Description': 'Freelance project payment'
              },
              {
                'Account Name': 'Credit Card',
                'Category': 'Expense',
                'Amount': '-45.67',
                'Date': '2024-01-08',
                'Description': 'Coffee shop'
              },
              {
                'Account Name': 'Checking Account',
                'Category': 'Expense',
                'Amount': '-1200.00',
                'Date': '2024-01-09',
                'Description': 'Rent payment'
              },
              {
                'Account Name': 'Savings Account',
                'Category': 'Income',
                'Amount': '25.50',
                'Date': '2024-01-10',
                'Description': 'Interest payment'
              },
              {
                'Account Name': 'Credit Card',
                'Category': 'Expense',
                'Amount': '-125.00',
                'Date': '2024-01-11',
                'Description': 'Restaurant dinner'
              },
              {
                'Account Name': 'Checking Account',
                'Category': 'Expense',
                'Amount': '-65.00',
                'Date': '2024-01-12',
                'Description': 'Phone bill'
              },
              {
                'Account Name': 'Credit Card',
                'Category': 'Expense',
                'Amount': '-199.99',
                'Date': '2024-01-13',
                'Description': 'Online shopping - Amazon'
              },
              {
                'Account Name': 'Checking Account',
                'Category': 'Income',
                'Amount': '5000.00',
                'Date': '2024-02-01',
                'Description': 'February Salary'
              },
              {
                'Account Name': 'Credit Card',
                'Category': 'Expense',
                'Amount': '-320.50',
                'Date': '2024-02-02',
                'Description': 'Groceries - Costco'
              },
              {
                'Account Name': 'Checking Account',
                'Category': 'Expense',
                'Amount': '-95.00',
                'Date': '2024-02-03',
                'Description': 'Car insurance'
              },
              {
                'Account Name': 'Savings Account',
                'Category': 'Transfer',
                'Amount': '1500.00',
                'Date': '2024-02-04',
                'Description': 'Emergency fund contribution'
              },
              {
                'Account Name': 'Credit Card',
                'Category': 'Expense',
                'Amount': '-78.90',
                'Date': '2024-02-05',
                'Description': 'Gym membership'
              },
              {
                'Account Name': 'Checking Account',
                'Category': 'Expense',
                'Amount': '-45.00',
                'Date': '2024-02-06',
                'Description': 'Streaming subscriptions'
              },
              {
                'Account Name': 'Credit Card',
                'Category': 'Expense',
                'Amount': '-156.78',
                'Date': '2024-02-07',
                'Description': 'Home improvement supplies'
              }
            ]
          }
        ]
      },
      {
        name: 'Side Project LLC',
        currency: 'USD',
        subscriptionPlan: 'free',
        role: 'owner',
        dataImports: [
          {
            filename: 'side-project-finances.csv',
            fileType: 'csv',
            data: [
              {
                'Date': '2024-01-15',
                'Description': 'Domain registration',
                'Amount': '-12.99',
                'Category': 'Business Expense'
              },
              {
                'Date': '2024-01-20',
                'Description': 'Hosting service',
                'Amount': '-25.00',
                'Category': 'Business Expense'
              },
              {
                'Date': '2024-02-01',
                'Description': 'First client payment',
                'Amount': '500.00',
                'Category': 'Revenue'
              },
              {
                'Date': '2024-02-10',
                'Description': 'Marketing ads',
                'Amount': '-75.00',
                'Category': 'Marketing'
              },
              {
                'Date': '2024-02-15',
                'Description': 'Second client payment',
                'Amount': '750.00',
                'Category': 'Revenue'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    email: 'user@example.com',
    password: 'user123',
    name: 'Regular User',
    organizations: [
      {
        name: 'Personal Finances',
        currency: 'USD',
        subscriptionPlan: 'free',
        role: 'owner',
        dataImports: [
          {
            filename: 'personal-budget.csv',
            fileType: 'csv',
            data: [
              {
                'Date': '2024-01-01',
                'Description': 'Salary deposit',
                'Amount': '3500.00',
                'Category': 'Income',
                'Account': 'Main Checking'
              },
              {
                'Date': '2024-01-02',
                'Description': 'Rent payment',
                'Amount': '-1200.00',
                'Category': 'Housing',
                'Account': 'Main Checking'
              },
              {
                'Date': '2024-01-03',
                'Description': 'Grocery shopping',
                'Amount': '-180.50',
                'Category': 'Food',
                'Account': 'Credit Card'
              },
              {
                'Date': '2024-01-04',
                'Description': 'Gas for car',
                'Amount': '-55.00',
                'Category': 'Transportation',
                'Account': 'Credit Card'
              },
              {
                'Date': '2024-01-05',
                'Description': 'Savings transfer',
                'Amount': '-500.00',
                'Category': 'Savings',
                'Account': 'Main Checking'
              },
              {
                'Date': '2024-01-06',
                'Description': 'Coffee subscription',
                'Amount': '-15.99',
                'Category': 'Food',
                'Account': 'Credit Card'
              },
              {
                'Date': '2024-01-07',
                'Description': 'Movie tickets',
                'Amount': '-24.00',
                'Category': 'Entertainment',
                'Account': 'Credit Card'
              },
              {
                'Date': '2024-01-08',
                'Description': 'Freelance income',
                'Amount': '300.00',
                'Category': 'Income',
                'Account': 'Main Checking'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    email: 'demo@example.com',
    password: 'demo123',
    name: 'Demo User',
    organizations: [
      {
        name: 'Demo Company',
        currency: 'EUR',
        subscriptionPlan: 'enterprise',
        role: 'owner',
        dataImports: [
          {
            filename: 'european-operations.csv',
            fileType: 'csv',
            data: [
              {
                'Date': '2024-01-01',
                'Description': 'Q1 Revenue - Product Sales',
                'Amount': '25000.00',
                'Category': 'Revenue',
                'Department': 'Sales'
              },
              {
                'Date': '2024-01-05',
                'Description': 'Office rent - Berlin',
                'Amount': '-2500.00',
                'Category': 'Operating Expense',
                'Department': 'Operations'
              },
              {
                'Date': '2024-01-10',
                'Description': 'Marketing campaign - Q1',
                'Amount': '-3500.00',
                'Category': 'Marketing',
                'Department': 'Marketing'
              },
              {
                'Date': '2024-01-15',
                'Description': 'Employee salaries',
                'Amount': '-18000.00',
                'Category': 'Payroll',
                'Department': 'HR'
              },
              {
                'Date': '2024-01-20',
                'Description': 'Software licenses',
                'Amount': '-1200.00',
                'Category': 'Technology',
                'Department': 'IT'
              },
              {
                'Date': '2024-02-01',
                'Description': 'Client payment - Large contract',
                'Amount': '45000.00',
                'Category': 'Revenue',
                'Department': 'Sales'
              },
              {
                'Date': '2024-02-05',
                'Description': 'Travel expenses - Conference',
                'Amount': '-2100.00',
                'Category': 'Travel',
                'Department': 'Business Development'
              }
            ]
          }
        ]
      }
    ]
  }
];

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  await prisma.dataImport.deleteMany();
  await prisma.organizationUser.deleteMany();
  await prisma.organization.deleteMany();
  
  console.log('✅ Database cleared');
}

async function createBetterAuthUser(user: SeedUser) {
  console.log(`👤 Creating user: ${user.email}`);
  
  try {
    const result = await authLocal.api.signUpEmail({
      body: {
        email: user.email,
        password: user.password,
        name: user.name,
      },
    });



    if (result.error) {
      if (result.error.message?.includes('already exists') || 
          result.error.body?.code === 'USER_ALREADY_EXISTS' ||
          result.error.body?.message?.includes('already exists')) {
        console.log(`   ℹ️  User ${user.email} already exists, skipping...`);
        return null;
      }
      throw new Error(`Failed to create user ${user.email}: ${result.error.message}`);
    }

    // Better Auth returns user data directly in the result
    const createdUser = result.user || result.data?.user || result.data?.session?.user || result.data;
    
    if (!createdUser || !createdUser.id) {
      throw new Error(`No user data returned for ${user.email}`);
    }

    console.log(`   ✅ User created with ID: ${createdUser.id}`);
    return createdUser;
  } catch (error: any) {
    // Handle APIError specifically
    if (error.body?.code === 'USER_ALREADY_EXISTS' || 
        error.body?.message?.includes('already exists') ||
        error.message?.includes('already exists')) {
      console.log(`   ℹ️  User ${user.email} already exists, skipping...`);
      return null;
    }
    throw error;
  }
}

async function createOrganizationAndData(userId: string, userEmail: string, orgData: SeedUser['organizations'][0]) {
  console.log(`🏢 Creating organization: ${orgData.name}`);
  
  try {
    const organization = await prisma.organization.create({
      data: {
        name: orgData.name,
        currency: orgData.currency,
        subscriptionPlan: orgData.subscriptionPlan,
        orgUsers: {
          create: {
            userId: userId,
            role: orgData.role === 'owner' ? 'admin' : orgData.role,
          }
        }
      }
    });

    console.log(`   ✅ Organization created with ID: ${organization.id}`);

    if (orgData.dataImports) {
      for (const importData of orgData.dataImports) {
        console.log(`   📊 Creating data import: ${importData.filename}`);
        
        const dataImport = await prisma.dataImport.create({
          data: {
            orgId: organization.id,
            fileType: importData.fileType,
            data: importData.data,
            metadata: {
              originalFilename: importData.filename,
              fileSize: JSON.stringify(importData.data).length,
              rowCount: importData.data.length,
              columns: Object.keys(importData.data[0] || {}),
              uploadedAt: new Date().toISOString(),
              seeded: true,
            },
            createdBy: userId,
          }
        });

        console.log(`     ✅ Data import created with ID: ${dataImport.id} (${importData.data.length} rows)`);
      }
    }

    return organization;
  } catch (error) {
    console.error(`❌ Failed to create organization ${orgData.name}:`, error);
    throw error;
  }
}

async function createSampleBudgetsAndScenarios(orgId: string, userId: string) {
  console.log(`   📋 Creating sample budgets and scenarios for org: ${orgId}`);

  const budget = await prisma.budget.create({
    data: {
      orgId,
      name: '2024 Annual Budget',
      data: {
        categories: {
          'Income': { planned: 60000, actual: 58500 },
          'Housing': { planned: 18000, actual: 18500 },
          'Food': { planned: 6000, actual: 5800 },
          'Transportation': { planned: 4800, actual: 4200 },
          'Entertainment': { planned: 2400, actual: 2100 },
          'Savings': { planned: 12000, actual: 13500 },
          'Other': { planned: 3600, actual: 3400 }
        },
        period: 'annual',
        year: 2024
      },
      createdBy: userId,
    }
  });

  const scenario = await prisma.scenario.create({
    data: {
      orgId,
      name: 'Conservative Growth Scenario',
      data: {
        assumptions: {
          incomeGrowth: 0.03,
          inflationRate: 0.025,
          savingsRate: 0.20
        },
        projections: {
          year1: { income: 60000, expenses: 48000, savings: 12000 },
          year2: { income: 61800, expenses: 49200, savings: 12600 },
          year3: { income: 63654, expenses: 50460, savings: 13194 }
        },
        type: 'financial_planning'
      },
      createdBy: userId,
    }
  });

  console.log(`     ✅ Budget created: ${budget.id}`);
  console.log(`     ✅ Scenario created: ${scenario.id}`);
}

async function createNotifications(orgId: string, userId: string) {
  console.log(`   🔔 Creating sample notifications for org: ${orgId}`);

  const notifications = [
    {
      type: 'data_import_success',
      message: 'Your CSV file has been successfully imported with 20 transactions.',
      read: false
    },
    {
      type: 'budget_alert',
      message: 'You are approaching your monthly food budget limit (85% used).',
      read: false
    },
    {
      type: 'integration_connected',
      message: 'Google Sheets integration has been successfully connected.',
      read: true
    }
  ];

  for (const notif of notifications) {
    await prisma.notification.create({
      data: {
        orgId,
        userId,
        type: notif.type,
        message: notif.message,
        read: notif.read,
      }
    });
  }

  console.log(`     ✅ Created ${notifications.length} notifications`);
}

async function main() {
  console.log('🌱 Starting development database seeding...\n');

  try {
    await clearDatabase();

    for (const userData of seedUsers) {
      console.log(`\n👥 Processing user: ${userData.email}`);
      
      let user = await createBetterAuthUser(userData);
      
      if (!user) {
        console.log(`   ⏭️  Skipping organizations for existing user: ${userData.email}`);
        continue;
      }

      for (const orgData of userData.organizations) {
        const organization = await createOrganizationAndData(user.id, user.email, orgData);
        await createSampleBudgetsAndScenarios(organization.id, user.id);
        await createNotifications(organization.id, user.id);
      }
    }

    console.log('\n🎉 Seeding completed successfully!\n');
    console.log('📋 Summary of seeded data:');
    console.log('==========================================');
    console.log('Users created:');
    for (const user of seedUsers) {
      console.log(`  • ${user.email} (password: ${user.password})`);
      for (const org of user.organizations) {
        console.log(`    - ${org.name} (${org.currency}, ${org.subscriptionPlan})`);
        if (org.dataImports) {
          for (const imp of org.dataImports) {
            console.log(`      * ${imp.filename} (${imp.data.length} rows)`);
          }
        }
      }
    }
    console.log('\n💡 You can now log in with any of these credentials!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('❌ Fatal error during seeding:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 