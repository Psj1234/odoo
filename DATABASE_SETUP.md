# Database Setup Guide

## Required Tables

The Prisma schema already includes all required tables:

1. ✅ **User** - User accounts and authentication
2. ✅ **Delivery** - Delivery orders
3. ✅ **Ledger** - Logs/audit trail of all stock movements
4. ✅ **Location** - Zones/Storage locations within warehouses

## Step 1: Verify Database Connection

1. Check your `.env` file in `backend/` folder:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/stockmaster?schema=public"
```

2. Test connection:
```bash
cd backend
node scripts/setup-db.js
```

## Step 2: Run Migrations

If tables don't exist, run migrations:

```bash
cd backend
npx prisma migrate dev --name init
```

This will:
- Create all tables in the database
- Generate migration files
- Update Prisma client

## Step 3: Generate Prisma Client

```bash
npx prisma generate
```

## Step 4: Seed Database (Optional)

```bash
npm run seed
```

## Step 5: Verify Tables

Run this SQL in your PostgreSQL database:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- User
- Category
- Product
- Warehouse
- Location
- Stock
- Receipt
- ReceiptItem
- Delivery
- DeliveryItem
- Transfer
- TransferItem
- Adjustment
- AdjustmentItem
- Ledger

## Troubleshooting

### Error: "Table does not exist"
- Run: `npx prisma migrate dev`

### Error: "Prisma Client not generated"
- Run: `npx prisma generate`

### Error: "Connection refused"
- Check DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- Verify database name exists

### Error: "Database updates not working"
- Check backend server logs
- Verify API routes are receiving requests
- Check browser console for errors
- Ensure authentication token is valid

## Quick Fix Commands

```bash
# Full reset (WARNING: Deletes all data)
cd backend
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
npm run seed

# Or just apply migrations
npx prisma migrate deploy
npx prisma generate
```

