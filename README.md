# 🍽️ Mess & Canteen Management System

A full-stack web application for managing mess/canteen operations including student billing, attendance tracking, staff management, and expense tracking.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Features

### For Owners/Admins
- 📊 **Dashboard** - Real-time stats on revenue, expenses, and student count
- 👥 **Student Management** - Add, edit, soft-delete students with flexible pricing
- 📅 **Attendance Tracking** - Mark daily attendance (Afternoon/Night shifts)
- 💰 **Bill Generation** - Automated monthly billing with attendance-based calculations
- 📱 **WhatsApp Integration** - Send bill reminders with one click
- 👨‍🍳 **Staff & Expenses** - Track staff salaries and operational expenses
- 🎯 **Holiday Management** - Configure holidays for billing adjustments

### For Students
- 📄 **View Bills** - See pending and paid bills
- 📥 **Download PDF Bills** - Get detailed PDF with payment breakdown
- 💳 **UPI Payment** - Pay directly via UPI deep links
- 📊 **Attendance Summary** - View absent days and meal counts

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose |
| **Auth** | JWT + BCrypt |
| **PDF** | PDFKit |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- MongoDB Atlas account ([Free tier](https://mongodb.com/atlas))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aadityaa-Sharma/Mess-Canteen-management-software.git
   cd Mess-Canteen-management-software
   ```

2. **Configure Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

3. **Install Dependencies**
   ```bash
   # Backend
   cd backend && npm install

   # Frontend
   cd ../frontend && npm install
   ```

4. **Start the Application**

   **Option 1: Using the startup script (Recommended)**
   ```bash
   # From root directory
   python3 start_all.py
   # OR: npm run dev
   ```

   **Option 2: Manual start**
   ```bash
   # Terminal 1 - Backend
   npm run server
   # OR: cd backend && node server.js

   # Terminal 2 - Frontend
   npm run client
   # OR: cd frontend && npm run dev
   ```

   **Option 3: Using npm dev script (runs both)**
   ```bash
   # From root directory - runs both backend and frontend
   npm run dev
   ```

5. **Open in Browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

---

## 🌐 Local Development vs Vercel Deployment

This codebase is configured to work in both local development and Vercel deployment environments.

### How It Works

**Local Development:**
- Backend Express server runs on port 5000
- Next.js frontend runs on port 3000
- Next.js rewrites proxy `/api/*` requests to `http://localhost:5000/api/*`
- Backend server starts normally when running `npm run server`

**Vercel Deployment:**
- Backend runs as serverless functions via `api/index.js`
- Next.js frontend is built and served by Vercel
- Vercel rewrites `/api/*` requests to the serverless function
- Backend server does NOT start (detected via `VERCEL` env variable)
- Database connection uses caching for serverless cold starts

### Key Configuration Files

- `frontend/next.config.ts` - Conditionally uses rewrites only in development
- `backend/server.js` - Skips HTTP server startup when `VERCEL` env is set
- `api/index.js` - Exports Express app for Vercel serverless functions
- `vercel.json` - Configures API route rewrites for Vercel

---

## 🔑 Default Credentials

| Role | Mobile | Password |
|------|--------|----------|
| **Owner** | `9999999999` | `admin123` |
| **Student** | `9000000001` | `student123` |

---

## 📁 Project Structure

```
├── backend/                 # Express.js API
│   ├── controllers/         # Business logic (7 controllers)
│   ├── models/              # Mongoose schemas (8 models)
│   ├── routes/              # API routes
│   ├── middleware/          # Auth & error handling
│   └── server.js            # Entry point
│
├── frontend/                # Next.js Application
│   ├── app/                 # App Router pages
│   │   ├── owner/           # Admin dashboard
│   │   └── student/         # Student portal
│   ├── components/          # Reusable UI
│   └── lib/                 # API client & utilities
│
├── documentation.md         # Technical documentation
├── beginner_guide.md        # User-friendly guide
└── README.md                # This file
```

---

## 📱 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/students` | List students |
| `POST` | `/api/attendance` | Mark attendance |
| `POST` | `/api/bills/generate` | Generate monthly bills |
| `GET` | `/api/bills/:id/download` | Download bill PDF |
| `GET` | `/api/dashboard` | Get dashboard stats |

See [documentation.md](./documentation.md) for full API reference.

---

## 💵 Billing Logic

### Meal Slots
- **BOTH** - Afternoon + Night (₹2700/month, 2 free holidays)
- **AFTERNOON** - Lunch only (₹1400/month, 0 free holidays)
- **NIGHT** - Dinner only (₹1400/month, 2 free holidays)

### Calculation
```
Per Meal Rate = Monthly Fee / (Days in Month × Meals/Day - Free Holidays)
Final Bill = Meals Present × Per Meal Rate
```

---

## 📄 PDF Bill Features

Downloaded bill PDFs include:
- Student details (name, mobile, meal slot)
- Billing summary (meals present/absent, per-meal rate)
- Absent dates with shift info (Afternoon/Night/Both)
- Final amount with payment status
- UPI payment link (clickable for pending bills)

---

## ⏰ Time Restrictions & Rules

| Operation | Past Limit | Future Limit | Notes |
|-----------|------------|--------------|-------|
| **Mark Attendance** | Up to 30 days ago | ❌ Not allowed | Cannot mark future dates |
| **Generate Bills** | Any past month | ❌ Current/past only | Cannot bill future months |
| **Add Expenses** | Any past date | ❌ Not allowed | Cannot add future expenses |
| **Edit Student** | Anytime | Anytime | No time restrictions |
| **Pay Salary** | Any past date | ❌ Not allowed | Prevents duplicate monthly payments |
| **Add Holidays** | Anytime | Anytime | Affects billing calculations |

### Key Rules:
- **Attendance**: Can be backdated up to 30 days for corrections
- **Bills**: Regenerating preserves already PAID bills
- **Expenses**: Date must be today or earlier
- **Student Join Date**: Affects pro-rated billing for partial months

---

## 🔧 Environment Variables

### Local Development

**Keep your `.env` file in the `backend/` directory:**

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/mess_db
JWT_SECRET=your-secret-key-min-32-chars
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
```

**Important**: The `.env` file should be in `backend/.env`, not in the root directory. The code is configured to look for it there.

### Vercel Deployment

Set these environment variables in your Vercel project settings:
- `DATABASE_URL` - Your MongoDB connection string
- `JWT_SECRET` - Your JWT secret key (min 32 characters)
- `ALLOWED_ORIGINS` - Your Vercel domain (e.g., `https://your-app.vercel.app`)
- `NODE_ENV` - Set to `production` (automatically set by Vercel)

**Note**: The `VERCEL` environment variable is automatically set by Vercel, which the code uses to detect the deployment environment.

---

## 📚 Documentation

- [📖 Technical Documentation](./documentation.md) - API reference, database schema, architecture
- [🔰 Beginner's Guide](./beginner_guide.md) - Step-by-step setup for non-developers

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Aadityaa Sharma**

- GitHub: [@Aadityaa-Sharma](https://github.com/Aadityaa-Sharma)
- GitHub: [@PrafullHarer](https://github.com/PrafullHarer)

---

*Last Updated: December 27, 2024*

*Made with ❤️ for mess owners and students*
