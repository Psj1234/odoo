# How to View Data in Database Tables

## Method 1: Prisma Studio (Easiest - Visual Browser)

Prisma Studio provides a visual interface to browse and edit your database.

### Start Prisma Studio:
```bash
cd backend
npm run studio
```

This will:
- Open a browser window (usually http://localhost:5555)
- Show all your tables in a sidebar
- Let you browse, search, and edit data visually
- No SQL knowledge needed!

### Features:
- ✅ View all records in any table
- ✅ Search and filter data
- ✅ Edit records directly
- ✅ Add new records
- ✅ Delete records
- ✅ See relationships between tables

---

## Method 2: Using SQL Queries (Direct Database Access)

### Connect to PostgreSQL:
```bash
# Using psql command line
psql -U your_username -d stockmaster

# Or if using connection string
psql "postgresql://user:password@localhost:5432/stockmaster"
```

### Useful SQL Queries:

```sql
-- View all users
SELECT * FROM "User";

-- View all deliveries
SELECT * FROM "Delivery";

-- View all ledger entries (logs)
SELECT * FROM "Ledger" ORDER BY "createdAt" DESC LIMIT 50;

-- View all locations (zones/storage)
SELECT * FROM "Location";

-- View all warehouses
SELECT * FROM "Warehouse";

-- View all products
SELECT * FROM "Product";

-- View stock levels
SELECT 
  p.sku,
  p.name,
  l.name as location,
  s.quantity
FROM "Stock" s
JOIN "Product" p ON s."productId" = p.id
JOIN "Location" l ON s."locationId" = l.id;

-- Count records in each table
SELECT 'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL SELECT 'Delivery', COUNT(*) FROM "Delivery"
UNION ALL SELECT 'Ledger', COUNT(*) FROM "Ledger"
UNION ALL SELECT 'Location', COUNT(*) FROM "Location"
UNION ALL SELECT 'Warehouse', COUNT(*) FROM "Warehouse"
UNION ALL SELECT 'Product', COUNT(*) FROM "Product"
UNION ALL SELECT 'Receipt', COUNT(*) FROM "Receipt"
UNION ALL SELECT 'Transfer', COUNT(*) FROM "Transfer"
UNION ALL SELECT 'Adjustment', COUNT(*) FROM "Adjustment"
UNION ALL SELECT 'Stock', COUNT(*) FROM "Stock";
```

---

## Method 3: Using Node.js Script

Create a script to view data:

```bash
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function viewData() {
  console.log('Users:', await prisma.user.findMany());
  console.log('Deliveries:', await prisma.delivery.findMany());
  console.log('Locations:', await prisma.location.findMany());
  await prisma.\$disconnect();
}
viewData();
"
```

---

## Method 4: Using Database GUI Tools

### pgAdmin (PostgreSQL Official Tool)
1. Download from: https://www.pgadmin.org/
2. Connect to your database
3. Browse tables in the left sidebar
4. Right-click table → View/Edit Data

### DBeaver (Universal Database Tool)
1. Download from: https://dbeaver.io/
2. Create new PostgreSQL connection
3. Enter your DATABASE_URL details
4. Browse tables and run queries

### TablePlus (Mac/Windows)
1. Download from: https://tableplus.com/
2. Add PostgreSQL connection
3. Browse and edit data visually

---

## Method 5: Quick Check Script

Use the script I created:

```bash
cd backend
npm run check-db
```

This shows:
- Table existence
- Record counts
- Connection status

---

## Recommended: Prisma Studio

**For quick viewing, use Prisma Studio:**

```bash
cd backend
npm run studio
```

Then open http://localhost:5555 in your browser.

You'll see:
- All tables listed
- Click any table to view data
- Search, filter, and edit records
- See relationships between tables

---

## View Specific Data Examples

### View Recent Deliveries:
```sql
SELECT 
  d."documentNumber",
  d.date,
  w.name as warehouse,
  d.status,
  COUNT(di.id) as item_count
FROM "Delivery" d
JOIN "Warehouse" w ON d."warehouseId" = w.id
LEFT JOIN "DeliveryItem" di ON d.id = di."deliveryId"
GROUP BY d.id, w.name
ORDER BY d."createdAt" DESC
LIMIT 10;
```

### View Stock by Location:
```sql
SELECT 
  w.name as warehouse,
  l.name as location,
  p.sku,
  p.name as product,
  s.quantity
FROM "Stock" s
JOIN "Product" p ON s."productId" = p.id
JOIN "Location" l ON s."locationId" = l.id
JOIN "Warehouse" w ON l."warehouseId" = w.id
ORDER BY w.name, l.name, p.sku;
```

### View Ledger (All Movements):
```sql
SELECT 
  l.date,
  p.sku,
  p.name as product,
  loc.name as location,
  l.type,
  l.quantity,
  l."documentNumber",
  u.name as user
FROM "Ledger" l
JOIN "Product" p ON l."productId" = p.id
JOIN "Location" loc ON l."locationId" = loc.id
JOIN "User" u ON l."userId" = u.id
ORDER BY l.date DESC, l."createdAt" DESC
LIMIT 50;
```

---

## Quick Start

**Easiest way:**
```bash
cd backend
npm run studio
```

Then browse your data visually! 🎉

