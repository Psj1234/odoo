# Fix Database Not Updating Issue

## Quick Fix Steps

### 1. Check Database Connection
```bash
cd backend
npm run check-db
```

This will show you:
- ✅ Which tables exist
- ❌ Which tables are missing
- Connection status

### 2. If Tables Are Missing

Run migrations:
```bash
cd backend
npx prisma migrate dev
```

This creates all tables:
- ✅ User
- ✅ Delivery  
- ✅ Ledger (logs)
- ✅ Location (zones/storage)
- ✅ Warehouse
- ✅ Product
- ✅ Receipt
- ✅ Transfer
- ✅ Adjustment
- ✅ Stock

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Verify Setup
```bash
npm run check-db
```

All tables should show ✅

## Common Issues

### Issue: "Table does not exist"
**Solution:** Run `npx prisma migrate dev`

### Issue: "Prisma Client not generated"  
**Solution:** Run `npx prisma generate`

### Issue: "Connection refused"
**Solution:** 
1. Check `backend/.env` has correct `DATABASE_URL`
2. Ensure PostgreSQL is running
3. Verify database name exists

### Issue: "Database updates not saving"
**Solution:**
1. Check backend server is running: `npm run dev`
2. Check browser console for API errors
3. Verify authentication token is valid
4. Check backend logs for errors

## Full Reset (if needed)

⚠️ **WARNING: This deletes all data!**

```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
npm run seed
```

## Verify Tables Exist

Run this in PostgreSQL:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
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

## Test Database Updates

1. **Create a Product:**
   - Go to Products page
   - Click "New Product"
   - Fill form and save
   - Check if it appears in the list

2. **Create a Receipt:**
   - Go to Receipts page
   - Click "New Receipt"
   - Add items and save
   - Check if it appears in the list

3. **Check Logs:**
   - Go to Ledger page
   - Should see entries after validating receipts/deliveries

## Still Not Working?

1. Check backend terminal for errors
2. Check browser console (F12) for API errors
3. Verify `.env` file has correct `DATABASE_URL`
4. Run `npm run check-db` to see detailed status

