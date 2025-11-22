# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- npm or yarn

## Step 1: Database Setup

1. Create a PostgreSQL database (local or use NeonDB/Supabase)
2. Copy the connection string

## Step 2: Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your DATABASE_URL

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Start backend
npm run dev
```

Backend will run on `http://localhost:5000`

## Step 3: Frontend Setup

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

## Step 4: First Login

1. Open `http://localhost:5173`
2. Enter phone number (E.164 format: +1234567890)
3. In development mode, use OTP code: `123456`
4. You'll be logged in and redirected to dashboard

## Step 5: Initial Data Setup

### Create Categories
Use the API or add manually:
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Electronics", "description": "Electronic products"}'
```

### Create Warehouse
```bash
curl -X POST http://localhost:5000/api/warehouses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Main Warehouse", "code": "WH-001", "address": "123 Main St"}'
```

### Create Location
```bash
curl -X POST http://localhost:5000/api/locations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"warehouseId": 1, "name": "Zone A", "code": "Z-A", "type": "STORAGE"}'
```

### Create Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku": "SKU-001", "name": "Product A", "categoryId": 1, "unit": "pcs"}'
```

## Testing the System

1. **Create a Receipt**:
   - Go to Receipts → New Receipt
   - Add products and quantities
   - Click "Validate"
   - Stock should increase automatically

2. **Create a Delivery**:
   - Go to Deliveries → New Delivery
   - Add products (must have stock)
   - Click "Validate"
   - Stock should decrease automatically

3. **Check Ledger**:
   - Go to Ledger
   - See all stock movements

4. **View Dashboard**:
   - See KPIs update in real-time

## Development Notes

- Backend uses Prisma ORM for database access
- Frontend uses Zustand for state management
- OTP authentication works with Twilio (configure in .env)
- In development, OTP code is always `123456`
- All stock updates are automated server-side

## Troubleshooting

**Database connection error**:
- Check DATABASE_URL in backend/.env
- Ensure PostgreSQL is running
- Verify connection string format

**CORS errors**:
- Check CORS_ORIGIN in backend/.env
- Should match frontend URL (http://localhost:5173)

**Prisma errors**:
- Run `npx prisma generate` after schema changes
- Run `npx prisma migrate dev` to apply migrations

**Frontend not connecting**:
- Check VITE_API_URL in frontend/.env
- Ensure backend is running on port 5000

---

**You're all set! Start building your inventory management system.**

