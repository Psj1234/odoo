
<div align="center">
	<h1>StockMaster</h1>
	<p><b>Modular Inventory Management System</b></p>
	<p>Production-grade, real-time inventory management for modern businesses.<br>
	Automate, track, and optimize your inventory across multiple warehouses.</p>
</div>

---

## 🚀 Quick Start

### Prerequisites
- <b>Node.js</b> v18 or higher
- <b>PostgreSQL</b> v14 or higher
- <b>npm</b> or <b>yarn</b>

### Backend Setup
```bash
cd backend
npm install
# Edit .env with your database and Twilio credentials
npx prisma migrate deploy
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
stockmaster/
├── backend/   # Node.js, Express, Prisma ORM
├── frontend/  # React, Vite, Tailwind CSS
└── docs/      # Documentation & guides
```

---

## 🎯 Key Features

- OTP-based authentication (secure login)
- Real-time dashboard with KPIs
- Multi-warehouse management
- Automated stock updates
- Receipts, deliveries, transfers, adjustments
- Complete move history ledger
- Low stock alerts
- Advanced filtering and search

---

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](docs) folder:
- Executive Project Overview
- API Documentation
- Deployment Guide
- UI/UX Design Specs
- Pitch Script

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Please open an issue or submit a pull request.

---

## 🛡️ License

This project is licensed under the MIT License.

