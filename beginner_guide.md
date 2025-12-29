# 🔰 Beginner's Guide: Mess Management System

Welcome! This guide is designed for users with **zero programming knowledge**. By following these simple steps, you will have the Mess Management System running on your computer in minutes.

---

## 📋 Table of Contents

1. [What is This System?](#-what-is-this-system)
2. [Prerequisites (One-Time Setup)](#-prerequisites-one-time-setup)
3. [Starting the Application](#-starting-the-application)
4. [Using the App](#-using-the-app)
5. [Common Tasks](#-common-tasks)
6. [Troubleshooting FAQ](#-troubleshooting-faq)
7. [Quick Reference](#-quick-reference)

---

## 🎯 What is This System?

The **Mess Management System** helps canteen owners:
- ✅ Keep track of students enrolled in the mess
- ✅ Mark daily attendance (Afternoon/Night shifts)
- ✅ Generate monthly bills automatically
- ✅ Send bill reminders via WhatsApp
- ✅ Track staff salaries and expenses
- ✅ View revenue and expense reports

Students can:
- 📱 View their pending and paid bills
- 💳 Pay via UPI with one click
- 📄 Download PDF bills with full details
- 📊 See their attendance summary

---

## 🛑 Prerequisites (One-Time Setup)

Before running the application, you need to install two things. **Do this only once.**

### Step 1: Install Node.js (The Engine)

Node.js is the software that runs the application.

1. Visit **[nodejs.org](https://nodejs.org/)**
2. Download the **LTS Version** (the big green button)
3. Run the downloaded file and click **Continue/Next** until finished

**Verify installation:**
Open Terminal (Mac) or Command Prompt (Windows) and type:
```bash
node --version
```
You should see something like `v20.10.0`

---

### Step 2: Set Up MongoDB (The Database)

The database stores all your data (students, bills, attendance).

#### Option A: MongoDB Atlas (Recommended - Free Cloud Database)

1. Visit **[mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)**
2. Click **Try Free** and create an account
3. Create a **Free Shared Cluster** (M0 tier)
4. Under **Security → Database Access**: Create a database user with password
5. Under **Security → Network Access**: Click "Add IP Address" → "Allow Access from Anywhere"
6. Under **Deployments**: Click **Connect** → **Connect your application**
7. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.xxx.mongodb.net/`)

#### Option B: Local MongoDB (Advanced)

1. Download **MongoDB Community Server** from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Install and run it as a service
3. Your connection string will be: `mongodb://localhost:27017/mess_db`

---

### Step 3: Configure the Application

1. Navigate to the `backend` folder inside your project
2. Create a file called `.env` (note the dot at the start)
3. Add the following content:

```env
PORT=5000
DATABASE_URL=your_mongodb_connection_string_here
JWT_SECRET=any_random_long_text_here_for_security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Example with MongoDB Atlas:**
```env
PORT=5000
DATABASE_URL=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/mess_db?retryWrites=true&w=majority
JWT_SECRET=supersecretkey123randomtext456
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

> 💡 **Tip:** Replace `myuser`, `mypassword123`, and the cluster URL with your actual MongoDB Atlas credentials.

---

## 🚀 Starting the Application

### Method 1: Using the Magic Script (Recommended)

This script will start both the backend and frontend for you.

1. **Open Terminal (Mac) or Command Prompt (Windows)**.
2. **Navigate to the project folder**.
3. **Run the Python script**:
   ```bash
   python3 start_all.py
   ```
   *(If `python3` doesn't work, try just `python`)*.

### Method 2: Using NPM (Alternative)

If you have Node.js installed, you can use this simple command:

1. **Open Terminal/Command Prompt**.
2. **Navigate to the project folder**.
3. **Run**:
   ```bash
   npm run dev
   ```

### Method 3: Manual Start (Advanced)

If the scripts don't work, start each part manually:

#### Terminal 1 - Start Backend:
```bash
cd backend
npm install
node seed.js
npm run server
```

#### Terminal 2 - Start Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

### ✅ Success! What You Should See:

```
============================================
   All Systems Operational!                 
   Backend:  http://localhost:5000          
   Frontend: http://localhost:3000          
============================================
Owner Login:   9999999999 / admin123
Student Login: 9000000001 / student123
Press Ctrl+C to stop everything.
```

---

## 🖥️ Using the App

### Step 1: Open the Application

Open your web browser (Chrome, Safari, Firefox) and go to:

👉 **[http://localhost:3000](http://localhost:3000)**

### Step 2: Login

Use these credentials:

| Role | Mobile Number | Password |
|:-----|:--------------|:---------|
| **Owner (Admin)** | `9999999999` | `admin123` |
| **Test Student** | `9000000001` | `student123` |

---

## 📝 Common Tasks

### Adding a New Student

1. Login as **Owner**
2. Click **Students** in the left sidebar
3. Click the **+ Add Student** button (top right)
4. Fill in the form:
   - **Name**: Student's full name
   - **Mobile**: 10-digit phone number (this is also their login ID)
   - **Mess Type**: 
     - `Standard` = ₹2700/month (2 meals)
     - `Single Meal` = ₹1500/month (1 meal)
     - `Custom` = You set the price
   - **Payment Mode**:
     - `Prepaid` = Fixed monthly fee
     - `Postpaid` = Pay based on attendance
5. Click **Add Student**

---

### Marking Daily Attendance

1. Go to **Attendance** in the sidebar
2. Select today's date using the date picker
3. For each student, click **Present** or **Absent**
4. Changes are saved automatically

> 💡 **Tip:** For Postpaid students, attendance directly affects their bill!

---

### Generating Monthly Bills

1. Go to **Bills** in the sidebar
2. Click **Generate Bills** (top right)
3. Select the month and year
4. Click **Confirm**

**What happens:**
- **Prepaid students**: Bill = Monthly Fee − Rebates
- **Postpaid students**: Bill = Days Present × Daily Rate

> ⚠️ **Note:** Already paid bills are preserved. Only pending bills are regenerated.

---

### Sending WhatsApp Bill Reminder

1. Go to **Bills**
2. Find the student's bill
3. Click the green **WhatsApp** button
4. WhatsApp will open with a pre-written message
5. Send it!

---

### Marking a Bill as Paid

1. Go to **Bills**
2. Find the pending bill
3. Click **Mark Paid**
4. Enter the transaction reference (UPI ID, Cash, Bank Transfer ID)
5. Confirm

---

### Downloading Bill PDF (For Students)

1. Login as a **Student**
2. In **Payment History** section, find your bill
3. Click the **Download** button (download icon)
4. PDF will download with:
   - Your details and meal slot
   - Meals present/absent count
   - Absent dates with shift (Afternoon/Night/Both)
   - UPI payment link (for pending bills)

---

### Paying via UPI

1. In the Student dashboard, click **Pay Now** on any pending bill
2. Your UPI app will open automatically
3. Complete the payment in your UPI app
4. Alternatively, click **Pay All Dues** to pay total pending amount

---

### Managing Staff & Expenses

1. Go to **Staff** in the sidebar
2. **Add Staff**: Click "+ Add Staff", enter name, role, and salary
3. **Pay Salary**: Click "Pay" next to a staff member
4. **Add Expense**: Scroll down to "Expenses", click "+ Add Expense"
   - Categories: Grocery, Gas, Electricity, Maintenance, Other

---

## ❓ Troubleshooting FAQ

### "npm is not recognized" / "node is not recognized"

**Cause:** Node.js is not installed properly.  
**Solution:** Reinstall Node.js from [nodejs.org](https://nodejs.org/) and restart your Terminal.

---

### "MongoNetworkError" / "Database Connection Failed"

**Cause:** Cannot connect to MongoDB.  
**Solution:**
1. Check if your internet is working
2. Verify the `DATABASE_URL` in `backend/.env` is correct
3. Make sure you allowed network access in MongoDB Atlas (Security → Network Access → Allow from Anywhere)

---

### "Address already in use" (Port 5000 or 3000)

**Cause:** The application is already running or another app is using that port.  
**Solution:**

**Mac/Linux:**
```bash
# Kill process on port 5000
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

Or simply: **Restart your computer**.

---

### "CORS Error" / "Network Error"

**Cause:** Backend and Frontend are not communicating properly.  
**Solution:**
1. Make sure the backend is running (Terminal should show "Server running")
2. Check that `ALLOWED_ORIGINS` in `.env` includes `http://localhost:3000`
3. Access via `localhost`, not an IP address

---

### The page is blank / shows loading forever

**Cause:** Frontend is still compiling or the backend is down.  
**Solution:**
1. Wait 10-15 seconds on first load
2. Check if backend terminal shows any errors
3. Try refreshing the page (`Ctrl+R` or `Cmd+R`)

---

### "Invalid mobile or password"

**Cause:** Wrong credentials or user doesn't exist.  
**Solution:**
- Owner: Mobile `9999999999`, Password `admin123`
- Re-run the seed script: `cd backend && node seed.js`

---

### How do I stop the application?

Go to the Terminal window and press **Ctrl + C**.

---

### How do I restart the application?

1. Stop it first with **Ctrl + C**
2. Run the start script again

---

## 📋 Quick Reference

### Login Credentials (Default)

| Role | Mobile | Password | Access |
|:-----|:-------|:---------|:-------|
| Owner | `9999999999` | `admin123` | Full access |
| Student 1 | `9000000001` | `student123` | View own bills |
| Student 2 | `9000000002` | `student123` | View own bills |
| ... | ... | ... | ... |
| Student 10 | `9000000010` | `student123` | View own bills |

---

### URLs

| Service | URL |
|:--------|:----|
| Application | [http://localhost:3000](http://localhost:3000) |
| Backend API | [http://localhost:5000](http://localhost:5000) |
| Health Check | [http://localhost:5000/health](http://localhost:5000/health) |

---

### Keyboard Shortcuts

| Shortcut | Action |
|:---------|:-------|
| `Ctrl + R` | Refresh page |
| `Ctrl + C` | Stop the application (in Terminal) |
| `Cmd + Space` | Open Spotlight (Mac) |

---

### File Locations

| File | Purpose |
|:-----|:--------|
| `backend/.env` | Database and security configuration |
| `backend/seed.js` | Creates test data |
| `start_all.py` | Cross-platform startup script |

---

### Mess Types & Pricing

| Type | Monthly Fee | Meals/Day |
|:-----|:------------|:----------|
| Standard | ₹2700 | 2 (Lunch + Dinner) |
| Single Meal | ₹1500 | 1 |
| Custom | You decide | You decide |

---

### Payment Modes

| Mode | Billing Logic |
|:-----|:--------------|
| **Prepaid** | Fixed monthly fee, regardless of attendance |
| **Postpaid** | Days Present × Daily Rate |

---

## 🆘 Need More Help?

1. Check the full [Technical Documentation](./documentation.md)
2. Look at the error messages in the Terminal
3. Make sure all prerequisites are installed correctly
4. Try restarting both the application and your computer

---

*Happy Managing! 🍽️*
