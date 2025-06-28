# Development Database Seeding

This document explains how to set up your local development environment with seed data to speed up development and testing.

## Overview

The seed script creates:
- **3 test users** with different roles and use cases
- **Multiple organizations** with different subscription plans and currencies
- **Financial data imports** with realistic transaction data
- **Sample budgets and scenarios**
- **Notifications** for testing

## Quick Start

### Prerequisites

1. Make sure your local database is running (SQLite or PostgreSQL)
2. Ensure your environment variables are properly configured
3. Run database migrations if needed

### Seeding the Database

For a complete setup (recommended for new developers):

```bash
npm run dev:setup
```

This will:
1. Clean up any existing database
2. Initialize the SQLite database
3. Seed with comprehensive test data
4. Display login credentials and next steps

For just seeding (if database is already initialized):

```bash
npm run db:seed
```

This will:
1. Clear existing development data
2. Create test users using Better Auth
3. Create organizations with proper relationships
4. Import financial data (CSV format)
5. Generate sample budgets, scenarios, and notifications

## Test Accounts

After seeding, you can log in with any of these accounts:

### Admin User
- **Email**: `keino.chichester@gmail.com`
- **Password**: `password123`
- **Organizations**:
  - **Acme Corporation** (Pro plan, USD) - 20 financial transactions
  - **Side Project LLC** (Free plan, USD) - 5 business transactions

### Regular User
- **Email**: `user@example.com`
- **Password**: `user123`
- **Organizations**:
  - **Personal Finances** (Free plan, USD) - 8 personal transactions

### Demo User
- **Email**: `demo@example.com`
- **Password**: `demo123`
- **Organizations**:
  - **Demo Company** (Enterprise plan, EUR) - 7 business transactions

## Data Structure

### Financial Data
Each organization includes realistic financial transaction data:
- **Income**: Salaries, freelance payments, interest
- **Expenses**: Rent, groceries, utilities, entertainment
- **Transfers**: Savings, emergency fund contributions
- **Business**: Revenue, operating expenses, marketing

### Sample Data Columns
The imported CSV data includes common financial fields:
- `Account Name`: Checking Account, Credit Card, Savings Account
- `Category`: Income, Expense, Transfer, Revenue, etc.
- `Amount`: Positive for income, negative for expenses
- `Date`: Transaction dates in YYYY-MM-DD format
- `Description`: Detailed transaction descriptions

### Budgets & Scenarios
- **Annual budgets** with planned vs actual spending
- **Financial scenarios** with growth projections
- **Notifications** for data imports and budget alerts

## Development Benefits

This seed data provides:
1. **Immediate testing capability** - No need to manually create data
2. **Realistic data patterns** - Based on actual financial transaction types
3. **Multiple user contexts** - Test different roles and use cases
4. **International scenarios** - Different currencies and business models
5. **Complete workflows** - From data import to analysis

## Sample CSV Files

The project includes ready-to-use sample CSV files for testing manual data imports:

- **`scripts/sample-data/personal-transactions.csv`** - Personal finance data with common categories
- **`scripts/sample-data/business-expenses.csv`** - Business expense tracking with departments
- **`scripts/sample-data/investment-portfolio.csv`** - Investment transactions and portfolio data

You can use these files to test the CSV upload functionality after seeding your database.

## Customizing Seed Data

To modify the seed data:

1. Edit `scripts/seed-development.ts`
2. Modify the `seedUsers` array to add/change:
   - User credentials
   - Organization details
   - Financial transaction data
   - Budget categories
3. Run `npm run db:seed` to apply changes

## Troubleshooting

### Database Connection Issues
```bash
# Check your DATABASE_URL in .env
echo $DATABASE_URL

# For SQLite, ensure the database file exists
ls -la *.db
```

### Better Auth Issues
```bash
# Ensure BETTER_AUTH_SECRET is set
echo $BETTER_AUTH_SECRET

# Clear auth tables if needed
# (Be careful in production!)
```

### Running Specific Parts
You can modify the seed script to only run certain parts by commenting out sections in the `main()` function.

## Data Reset

To clear all seed data and start fresh:

```bash
npm run db:seed
```

The script automatically clears existing data before creating new seed data.

## Integration with Development Workflow

### Before Starting Development
```bash
# 1. Start your development server
npm run dev

# 2. Seed the database (in another terminal)
npm run db:seed

# 3. Log in with any test account
# Go to http://localhost:3000/auth/login
```

### Testing Scenarios
- **Data Import Testing**: Upload new CSV files to existing orgs
- **Multi-tenant Testing**: Switch between different organizations
- **Permission Testing**: Test different user roles
- **Financial Analysis**: Use the pre-loaded transaction data

## Production Safety

⚠️ **Important**: This seed script is designed for development only and includes:
- Hardcoded passwords
- Test email addresses
- Sample financial data

Never run this script against production databases. 