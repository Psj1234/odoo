# Deployment Instructions

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (NeonDB, Supabase, or Railway)
- Twilio account for OTP (or use mock for development)
- GitHub account for version control

## Step 1: Database Setup

### Option A: NeonDB (Recommended - Free Tier)

1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string (looks like: `postgresql://user:pass@host/dbname`)
4. Save it for backend `.env` file

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string

### Option C: Railway

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL service
4. Copy the connection string from Variables tab

## Step 2: Backend Deployment (Railway/Render)

### Using Railway

1. **Install Railway CLI** (optional, or use web UI):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize Railway project**:
   ```bash
   cd backend
   railway init
   ```

3. **Add PostgreSQL service** (if not using external DB):
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"

4. **Set Environment Variables** in Railway dashboard:
   ```
   DATABASE_URL=<your-postgres-connection-string>
   JWT_SECRET=<generate-random-string>
   JWT_EXPIRES_IN=7d
   PORT=5000
   NODE_ENV=production
   TWILIO_ACCOUNT_SID=<your-twilio-sid>
   TWILIO_AUTH_TOKEN=<your-twilio-token>
   TWILIO_VERIFY_SERVICE_SID=<your-verify-service-sid>
   CORS_ORIGIN=<your-frontend-url>
   ```

5. **Deploy**:
   ```bash
   railway up
   ```
   Or connect GitHub repo and enable auto-deploy

6. **Run migrations**:
   ```bash
   railway run npx prisma migrate deploy
   ```

7. **Copy backend URL** (e.g., `https://your-app.railway.app`)

### Using Render

1. Go to [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select the `backend` folder
5. Configure:
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. Add environment variables (same as Railway)
7. Deploy
8. Run migrations: SSH into service or use Render shell:
   ```bash
   npx prisma migrate deploy
   ```

## Step 3: Frontend Deployment (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd frontend
   vercel
   ```
   Follow prompts:
   - Link to existing project or create new
   - Set root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`

4. **Set Environment Variables** in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

5. **Redeploy** after setting env vars:
   ```bash
   vercel --prod
   ```

### Alternative: Netlify

1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add environment variable: `VITE_API_URL`
5. Deploy

## Step 4: Environment Variables

### Backend `.env` (Production)

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=production

# Twilio (for OTP)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend `.env` (Production)

```env
VITE_API_URL=https://your-backend.railway.app/api
```

## Step 5: Build Commands

### Backend

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start production server
npm start
```

### Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build (optional)
npm run preview
```

## Step 6: Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Backend API is accessible (test: `GET /api/health`)
- [ ] Frontend loads without errors
- [ ] OTP login works (test with real phone number)
- [ ] CORS is configured correctly
- [ ] Environment variables are set
- [ ] SSL certificates are active (HTTPS)

## Step 7: Health Check Endpoints

### Backend Health Check

Create a simple endpoint to verify deployment:

```javascript
// backend/src/routes/health.js
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

Test: `https://your-backend.railway.app/api/health`

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check if database allows connections from your server IP
- Ensure SSL is enabled if required (add `?sslmode=require` to connection string)

### CORS Errors

- Verify `CORS_ORIGIN` matches your frontend URL exactly
- For development, use `CORS_ORIGIN=http://localhost:5173`

### Prisma Migration Issues

- Run `npx prisma migrate reset` (WARNING: deletes all data)
- Or manually fix migration files
- Check Prisma logs for specific errors

### Build Failures

- Check Node.js version (must be 18+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

## Quick Deploy Script

Create `deploy.sh`:

```bash
#!/bin/bash

# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
railway up

# Frontend
cd ../frontend
npm install
npm run build
vercel --prod
```

Make executable: `chmod +x deploy.sh`

## Production Optimizations

1. **Enable Prisma Query Engine**: Already included
2. **Add Rate Limiting**: Use `express-rate-limit`
3. **Enable Compression**: Use `compression` middleware
4. **Add Logging**: Use `winston` or `pino`
5. **Monitor Errors**: Use Sentry or similar
6. **Database Indexing**: Already in Prisma schema
7. **CDN for Frontend**: Vercel handles this automatically

## Cost Estimates (Free Tiers)

- **NeonDB**: Free tier (0.5 GB storage, shared CPU)
- **Railway**: $5/month free credit
- **Vercel**: Free tier (100 GB bandwidth)
- **Twilio**: $0.05 per OTP verification

**Total**: ~$5-10/month for small-scale usage

---

**Your app should be live in ~30 minutes!**

