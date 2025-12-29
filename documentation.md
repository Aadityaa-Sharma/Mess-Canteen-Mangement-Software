# 📚 Mess Management System - Technical Documentation

A comprehensive, full-stack **Mess/Canteen Management System** for handling student billing, attendance tracking, staff management, and expense tracking. Built with modern web technologies featuring a responsive UI, robust backend API, and automated billing logic.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **State Management** | React Query (@tanstack/react-query), React Context API |
| **HTTP Client** | Axios with interceptors |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (JSON Web Tokens), BCrypt password hashing |
| **Validation** | Joi schema validation |
| **Security** | Helmet, CORS, HttpOnly cookies |

---

## 📂 Project Structure

```
mess-management/
├── frontend/                     # Next.js 16 Application
│   ├── app/                      # App Router Pages
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── globals.css           # Global styles & Tailwind
│   │   ├── login/page.tsx        # Authentication page
│   │   ├── owner/                # Owner dashboard & features
│   │   │   ├── page.tsx          # Main dashboard with stats
│   │   │   ├── layout.tsx        # Owner layout with sidebar
│   │   │   ├── attendance/       # Attendance management
│   │   │   ├── students/         # Student CRUD operations
│   │   │   ├── bills/            # Bill generation & tracking
│   │   │   ├── staff/            # Staff & expense management
│   │   └── student/page.tsx      # Student dashboard (view bills)
│   ├── components/               # Reusable UI Components
│   │   └── OwnerSidebar.tsx      # Navigation sidebar
│   ├── context/                  # React Context Providers
│   │   └── AuthContext.tsx       # Authentication state
│   ├── lib/                      # Utilities
│   │   ├── api.ts                # Axios instance with interceptors
│   │   └── providers.tsx         # QueryClient + Auth providers
│   │
│   └── package.json              # Frontend dependencies
│
├── backend/                      # Express.js API Server
│   ├── config/
│   │   └── db.js                 # MongoDB connection (Mongoose)
│   ├── controllers/              # Business Logic (7 controllers)
│   │   ├── authController.js     # Login, token generation
│   │   ├── studentController.js  # Student CRUD
│   │   ├── billController.js     # Bill generation engine
│   │   ├── attendanceController.js
│   │   ├── dashboardController.js
│   │   ├── staffController.js    # Staff + expenses
│   │   └── holidayController.js
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT protection + role check
│   │   ├── errorMiddleware.js    # Global error handler
│   ├── models/                   # Mongoose Schemas (8 models)
│   │   ├── userModel.js          # Users (Owner/Student/Manager)
│   │   ├── billModel.js          # Monthly bills
│   │   ├── attendanceModel.js    # Daily attendance records
│   │   ├── staffModel.js         # Staff + salary payments
│   │   ├── expenseModel.js       # Operational expenses
│   │   ├── holidayModel.js       # Calendar holidays
│   │   ├── auditLogModel.js      # Action audit trail
│   │   └── mealRequestModel.js   # Meal skip requests
│   ├── routes/                   # API Route Definitions (7 routers)
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── billRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── staffRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── holidayRoutes.js
│   ├── utils/
│   │   ├── asyncHandler.js       # Async error wrapper
│   │   └── validation.js         # Joi validation schemas
│   ├── server.js                 # Express app entry point
│   ├── seed.js                   # Database seeder (test data)
│   └── setup_db.js               # Legacy PostgreSQL setup
│
├── start_all.py                  # Python startup script (cross-platform)
└── package.json                  # Root workspace config
```

---

## 🗃️ Database Schema (MongoDB Collections)

### Users Collection
Stores all users including owners, students, and managers.

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Full name (required) |
| `email` | String | Email address (optional) |
| `mobile` | String | 10-digit phone, unique (required) |
| `passwordHash` | String | BCrypt hashed password |
| `role` | Enum | `OWNER`, `STUDENT`, `MANAGER` |
| `status` | String | `ACTIVE`, `INACTIVE` |
| `monthlyFee` | Number | Fixed monthly fee (PREPAID) |
| `paymentMode` | String | `PREPAID` or `POSTPAID` |
| `dailyRate` | Number | Per-day rate (POSTPAID) |
| `messType` | String | `STANDARD` (₹2700), `SINGLE_MEAL` (₹1500), `CUSTOM` |
| `mealsPerDay` | Number | 1-3 meals per day |
| `joinedAt` | Date | Enrollment date |
| `advanceBalance` | Number | Prepaid advance amount |
| `rebateEligible` | Boolean | Eligible for meal skip rebates |
| `rebateAmountPerMeal` | Number | Rebate per skipped meal |
| `isDeleted` | Boolean | Soft delete flag |

### Bills Collection
Monthly billing records.

| Field | Type | Description |
|-------|------|-------------|
| `studentId` | ObjectId | Reference to User |
| `month` | String | Month name (e.g., "January") |
| `year` | Number | Year (e.g., 2024) |
| `baseAmount` | Number | Original amount before rebates |
| `rebateAmount` | Number | Total rebate applied |
| `finalAmount` | Number | Amount to pay |
| `status` | String | `PENDING`, `PAID` |
| `breakdown` | Object | Calculation details (JSON) |
| `generatedAt` | Date | Bill generation timestamp |
| `paidAt` | Date | Payment timestamp |
| `paymentReference` | String | UPI/Transaction ID |

### Attendance Collection
Daily attendance records with unique index on (studentId, dateStr).

| Field | Type | Description |
|-------|------|-------------|
| `studentId` | ObjectId | Reference to User |
| `dateStr` | String | Attendance date (YYYY-MM-DD format) |
| `afternoonStatus` | Enum | `PRESENT`, `ABSENT`, `null` |
| `nightStatus` | Enum | `PRESENT`, `ABSENT`, `null` |

### Staff Collection
Kitchen/support staff management.

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Staff name |
| `role` | String | Job role (e.g., Cook, Helper) |
| `salary` | Number | Monthly salary |
| `status` | String | `ACTIVE`, `INACTIVE` |

### StaffPayment Collection
Salary payment records with duplicate payment prevention per month.

| Field | Type | Description |
|-------|------|-------------|
| `staffId` | ObjectId | Reference to Staff |
| `amount` | Number | Payment amount |
| `paymentDate` | Date | Payment date |

### Expense Collection
Operational expenses tracking.

| Field | Type | Description |
|-------|------|-------------|
| `description` | String | Expense description |
| `amount` | Number | Expense amount |
| `category` | Enum | `GROCERY`, `GAS`, `ELECTRICITY`, `MAINTENANCE`, `OTHER` |
| `date` | Date | Expense date |
| `createdBy` | ObjectId | Reference to User |

### Holiday Collection
Calendar of holidays (unique date constraint).

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Holiday name |
| `date` | Date | Holiday date (unique) |

### MealRequest Collection
Student meal skip requests for rebate eligibility.

| Field | Type | Description |
|-------|------|-------------|
| `studentId` | ObjectId | Reference to User |
| `date` | Date | Requested date |
| `mealType` | Enum | `LUNCH`, `DINNER` |
| `isSkipped` | Boolean | Skip indicator |
| `approved` | Boolean | Owner approval status |

### AuditLog Collection
Action audit trail for compliance.

| Field | Type | Description |
|-------|------|-------------|
| `userId` | ObjectId | User who performed action |
| `action` | String | Action type (e.g., `BULK_BILL_GEN`) |
| `tableName` | String | Affected collection |
| `recordId` | String | Affected record ID |
| `oldValues` | Object | Previous state |
| `newValues` | Object | New state |
| `ipAddress` | String | Request IP |

---

## 💻 API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/login` | User login | None |
| `GET` | `/auth/me` | Get current user | Bearer |

**Login Request:**
```json
{
  "mobile": "9999999999",
  "password": "admin123"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Owner",
    "role": "OWNER",
    "mobile": "9999999999"
  }
}
```

---

### Students (Owner Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/students` | List all students |
| `POST` | `/students` | Add new student |
| `PUT` | `/students/:id` | Update student |
| `DELETE` | `/students/:id` | Soft delete student |

**Add Student Request:**
```json
{
  "name": "John Doe",
  "mobile": "9876543210",
  "password": "password123",
  "mess_type": "STANDARD",
  "payment_mode": "PREPAID",
  "monthly_fee": 2700,
  "daily_rate": 100,
  "meals_per_day": 2,
  "joined_at": "2024-01-15"
}
```

**Mess Type Auto-Pricing:**
- `STANDARD` → ₹2700/month (2 meals)
- `SINGLE_MEAL` → ₹1500/month (1 meal)
- `CUSTOM` → Owner-defined

---

### Attendance (Owner Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/attendance?date=YYYY-MM-DD` | Get attendance for date |
| `POST` | `/attendance` | Mark batch attendance |

**Mark Attendance Request:**
```json
{
  "date": "2024-12-26",
  "attendanceData": [
    { "studentId": "507f1f77bcf86cd799439011", "status": "PRESENT" },
    { "studentId": "507f1f77bcf86cd799439012", "status": "ABSENT" }
  ]
}
```

---

### Bills

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/bills` | Get bills (filtered by role) | Bearer |
| `POST` | `/bills/generate` | Generate monthly bills | Owner |
| `GET` | `/bills/:id/download` | Download bill as PDF | Bearer |
| `PUT` | `/bills/:id/pay` | Mark bill as paid | Owner |

**Generate Bills Request:**
```json
{
  "month": "December",
  "year": 2024
}
```

**Bill Calculation Logic:**
1. **Attendance-Based Billing:**
   - Per Meal Rate = Monthly Fee / (Days × Meals/Day - Free Holidays)
   - Final Amount = Meals Present × Per Meal Rate

2. **Pro-rated Billing (no attendance):**
   - Pro-rated fee based on days enrolled

**Bill Breakdown Includes:**
- `meals_present` - Number of meals attended
- `meals_absent` - Number of meals missed
- `absent_dates` - Array of absent dates with shift info (Afternoon/Night/Both)

**PDF Download Features:**
- Student details (name, mobile, meal slot)
- Billing summary with per-meal rate
- Absent dates with shift information
- UPI payment link (clickable for pending bills)

---

### Dashboard (Owner Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard` | Get aggregated statistics |

**Response:**
```json
{
  "stats": {
    "students": 25,
    "staff": 5,
    "revenue": 45000,
    "pending": 12500,
    "expense": 8000,
    "staffExpense": 5000,
    "operationalExpense": 3000,
    "netIncome": 37000
  },
  "monthlyStats": [
    { "month": "December", "year": 2024, "revenue": 15000, "pending": 5000, "totalBills": 10 }
  ],
  "currentMonthExpense": {
    "staffSalaries": 2500,
    "operational": 1500,
    "total": 4000,
    "month": "December",
    "year": 2024
  }
}
```

---

### Staff & Expenses (Owner Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/staff` | List all staff |
| `POST` | `/staff` | Add staff member |
| `PUT` | `/staff/:id` | Update staff |
| `DELETE` | `/staff/:id` | Remove staff |
| `POST` | `/staff/:id/pay` | Record salary payment |
| `GET` | `/staff/payments` | Payment history |
| `GET` | `/staff/expenses` | List expenses |
| `POST` | `/staff/expenses` | Add expense |
| `DELETE` | `/staff/expenses/:id` | Delete expense |

**Add Expense Request:**
```json
{
  "description": "Monthly groceries",
  "amount": 5000,
  "category": "GROCERY",
  "date": "2024-12-20"
}
```

---

### Holidays

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/holidays` | List holidays | Bearer |
| `POST` | `/holidays` | Add holiday | Owner |
| `DELETE` | `/holidays/:id` | Remove holiday | Owner |

---

## 🔐 Authentication & Authorization

### JWT Token Flow
1. User submits mobile + password to `/auth/login`
2. Server validates credentials with BCrypt
3. On success, generates JWT with `{ id, role }` payload
4. Token stored in:
   - HttpOnly cookie (secure)
   - Returned in response for localStorage fallback

### Middleware Chain
```
Request → protect → ownerOnly → Controller
```

1. **protect**: Validates JWT from `Authorization: Bearer <token>` or cookie
2. **ownerOnly**: Checks `req.user.role === 'OWNER'`

### Role Permissions

| Feature | Student | Owner |
|---------|---------|-------|
| View own bills | ✅ | ✅ |
| View all bills | ❌ | ✅ |
| Manage students | ❌ | ✅ |
| Mark attendance | ❌ | ✅ |
| Generate bills | ❌ | ✅ |
| Manage staff | ❌ | ✅ |
| View dashboard | ❌ | ✅ |

---

## 🎨 Frontend Architecture

### State Management
- **React Query**: Server state (API data caching)
- **AuthContext**: Authentication state (user, login, logout)
- **Local State**: Component-specific UI state

### API Client Configuration
```typescript
// lib/api.ts
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
});

API.interceptors.request.use((req) => {
  const token = Cookies.get('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});
```

### Page Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Landing page | Marketing homepage |
| `/login` | Login form | Mobile + password auth |
| `/owner` | Dashboard | Stats, monthly breakdown, quick actions |
| `/owner/students` | Student grid | Add/Edit/Delete students |
| `/owner/attendance` | Attendance sheet | Daily marking |
| `/owner/bills` | Bills list | Generate, track, WhatsApp |
| `/owner/staff` | Staff management | Staff + expenses |
| `/student` | Student dashboard | View personal bills |

---

## ⚙️ Environment Configuration

### Backend `.env`
```env
PORT=5000
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/mess_db?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

| Variable | Description |
|----------|-------------|
| `PORT` | Backend server port |
| `DATABASE_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars recommended) |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins |

---

## 🚀 Startup Scripts

### Manual Startup (Cross-Platform)

**Option 1: Using Python Script**
```bash
python3 start_all.py
```

**Option 2: Using NPM (runs both servers)**
```bash
npm run dev
```

### What the scripts do:
1. Client: `npm run client` (Next.js on port 3000)
2. Server: `npm run server` (Express on port 5000)

**Note:** The backend requires `.env` configuration before starting.

---

## 🧪 Default Test Credentials

| Role | Mobile | Password |
|------|--------|----------|
| **Owner (Admin)** | `9999999999` | `admin123` |
| **Student 1-10** | `9000000001` - `9000000010` | `student123` |

---

## 🔧 Validation Rules (Joi Schemas)

### Login
```javascript
{
  mobile: Joi.string().required(),
  password: Joi.string().required()
}
```

### Add Student
```javascript
{
  name: Joi.string().required(),
  mobile: Joi.string().pattern(/^[0-9]+$/).length(10).required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().allow(null, ''),
  mess_type: Joi.string().valid('STANDARD', 'SINGLE_MEAL', 'CUSTOM').default('STANDARD'),
  payment_mode: Joi.string().valid('PREPAID', 'POSTPAID').default('PREPAID'),
  monthly_fee: Joi.number().optional(),
  daily_rate: Joi.number().optional(),
  meals_per_day: Joi.number().integer().min(1).max(3).default(2),
  joined_at: Joi.alternatives().try(Joi.date(), Joi.string()).optional(),
  advance_balance: Joi.number().optional()
}
```

### Generate Bill
```javascript
{
  month: Joi.string().required(),  // e.g., "December"
  year: Joi.number().integer().required()  // e.g., 2024
}
```

---

## 🛠️ Troubleshooting

### Connection Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `MongoNetworkError` | MongoDB unreachable | Check `DATABASE_URL`, ensure cluster is running |
| `CORS Error` | Origin not whitelisted | Add frontend URL to `ALLOWED_ORIGINS` |
| `401 Unauthorized` | Invalid/expired token | Re-login to get fresh token |
| `EADDRINUSE` | Port already in use | Kill process on port 5000 or 3000 |

### Database Issues
```bash
# Check MongoDB connection
node -e "require('./backend/config/db').connectDB()"

# Re-run seed (safe, idempotent)
cd backend && node seed.js
```

### Frontend Issues
```bash
# Clear Next.js cache
cd frontend && rm -rf .next && npm run dev

# Reinstall dependencies
rm -rf node_modules package-lock.json && npm install
```

---

## 📱 WhatsApp Integration

The system uses client-side WhatsApp Web links for bill notifications:

```javascript
const message = `Hello ${studentName}, your mess bill for ${month} ${year} is ₹${amount}. Please pay to avoid late fees.`;
window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(message)}`, '_blank');
```

This opens WhatsApp Web/App with a pre-filled message - no backend API required.

---

## 🔄 Bill Generation Workflow

```mermaid
graph TD
    A[Owner clicks Generate Bills] --> B{Existing bills for month?}
    B -->|Yes| C[Confirm regeneration]
    B -->|No| D[Confirm generation]
    C --> E[Delete PENDING bills only]
    D --> E
    E --> F[Fetch ACTIVE students]
    F --> G{Payment Mode?}
    G -->|PREPAID| H[Calculate: monthlyFee - rebates]
    G -->|POSTPAID| I[Calculate: daysPresent × dailyRate]
    H --> J[Create bill record]
    I --> J
    J --> K[Log to AuditLog]
    K --> L[Return summary]
```

---

## 🏗️ Development Guidelines

### Adding a New Feature
1. Create Mongoose model in `backend/models/`
2. Add controller in `backend/controllers/`
3. Define routes in `backend/routes/`
4. Register routes in `backend/server.js`
5. Add Joi schema in `backend/utils/validation.js`
6. Create frontend page in `frontend/app/`
7. Add to sidebar in `frontend/components/OwnerSidebar.tsx`

### Code Style
- Use async/await with `asyncHandler` wrapper
- Validate all inputs with Joi schemas
- Use Mongoose helper functions in models
- Keep controllers focused on business logic
- Use TypeScript interfaces in frontend

---

## 📊 Performance Considerations

1. **Indexes**: Attendance has compound index on `(studentId, date)`
2. **Aggregation**: Dashboard uses MongoDB aggregation pipeline
3. **Caching**: React Query caches data for 60 seconds
4. **Pagination**: Not implemented - consider for large datasets
5. **Connection Pool**: Mongoose manages connection pooling automatically

---

## 📱 UPI Payment Integration

Students can pay bills directly via UPI deep links:

```javascript
const upiLink = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&cu=INR&tn=Mess-Bill-${month}-${year}`;
```

Features:
- **Single Bill Payment** - Pay individual pending bill
- **Pay All Dues** - Pay total pending amount at once
- **PDF Integration** - Clickable UPI link in downloaded PDF

---

## 📄 PDF Bill Generation

Bills can be downloaded as PDF with:
- Header with month/year
- Student details (name, mobile, email, meal slot)
- Billing summary (per meal rate, meals present/absent)
- Absent dates with shift information (Afternoon/Night/Both)
- Final amount with payment status
- UPI payment box with clickable link (pending bills only)

---

*Last Updated: December 2024*
