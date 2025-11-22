# StockMaster - Modular Inventory Management System

A production-grade, real-time Inventory Management System built for an 8-hour hackathon. Replaces manual registers and Excel with a fully automated, multi-warehouse inventory tracking solution.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env with database and Twilio credentials
npx prisma migrate dev
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 📁 Project Structure

```
stockmaster/
├── backend/          # Node.js + Express + Prisma
├── frontend/         # React + Vite + Tailwind
└── docs/            # Documentation
```

## 🎯 Features

- ✅ OTP-based authentication
- ✅ Real-time dashboard with KPIs
- ✅ Multi-warehouse support
- ✅ Automated stock updates
- ✅ Receipts, Deliveries, Transfers, Adjustments
- ✅ Complete move history ledger
- ✅ Low stock alerts
- ✅ Advanced filtering and search

## 📚 Documentation

See `/docs` folder for:
- Executive Project Overview
- API Documentation
- Deployment Guide
- UI/UX Design Specs
- Pitch Script

