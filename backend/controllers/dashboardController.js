const { getISTDate, getTodayStr } = require('../utils/dateUtils'); // Import utils
const { User } = require('../models/userModel');
const { Staff } = require('../models/staffModel');
const { Bill } = require('../models/billModel');
const { Expense } = require('../models/expenseModel');
const { SideIncome } = require('../models/sideIncomeModel');

const getDashboardStats = async (req, res) => {
    try {
        // Initialize defaults
        let students = 0;
        let staff = 0;
        let revenue = 0;
        let pending = 0;
        let fixedExpense = 0;        // Recurring monthly: rent, salaries
        let staffPayments = 0;       // Actual salary payments made
        let operationalExpense = 0;  // Monthly variable expenses
        let sideIncome = 0;          // Side income (snacks, pani puri, custom)
        let monthlyStats = [];
        const now = getISTDate(); // Use IST date
        let currentMonthExpense = {
            fixed: 0,
            operational: 0,
            total: 0,
            month: now.toLocaleString('default', { month: 'long' }),
            year: now.getFullYear()
        };

        // Calculate current month date range
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Query each stat separately
        try {
            students = await User.countDocuments({ role: 'STUDENT', status: 'ACTIVE', isDeleted: false });
        } catch (e) {
            console.error('Dashboard: Failed to get student count', e.message);
        }

        try {
            staff = await Staff.countDocuments({ status: 'ACTIVE' });
        } catch (e) {
            console.log('Dashboard: Staff count failed');
        }

        try {
            // Aggregate revenue (PAID bills)
            const revResult = await Bill.aggregate([
                { $match: { status: 'PAID' } },
                { $group: { _id: null, total: { $sum: '$finalAmount' } } }
            ]);
            revenue = revResult.length > 0 ? revResult[0].total : 0;
        } catch (e) {
            console.error('Dashboard: Failed to get revenue', e.message);
        }

        try {
            // Aggregate pending bills
            const penResult = await Bill.aggregate([
                { $match: { status: 'PENDING' } },
                { $group: { _id: null, total: { $sum: '$finalAmount' } } }
            ]);
            pending = penResult.length > 0 ? penResult[0].total : 0;
        } catch (e) {
            console.error('Dashboard: Failed to get pending', e.message);
        }

        try {
            // NEW: Aggregate FIXED monthly expenses (rent, salaries from Staff collection)
            const fixedExpResult = await Staff.aggregate([
                { $match: { status: 'ACTIVE' } },
                { $group: { _id: null, total: { $sum: '$salary' } } }
            ]);
            fixedExpense = fixedExpResult.length > 0 ? fixedExpResult[0].total : 0;
        } catch (e) {
            console.log('Dashboard: Fixed expense aggregation failed');
        }

        try {
            // Aggregate operational expenses (grocery, gas, electricity, etc.) for current month
            // Match strings starting with YYYY-MM
            const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const opExpResult = await Expense.aggregate([
                { $match: { dateStr: { $regex: `^${monthPrefix}` } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            operationalExpense = opExpResult.length > 0 ? opExpResult[0].total : 0;
        } catch (e) {
            console.log('Dashboard: Operational expenses aggregation failed');
        }

        try {
            // Aggregate side income for current month
            const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const sideIncomeResult = await SideIncome.aggregate([
                { $match: { dateStr: { $regex: `^${monthPrefix}` } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            sideIncome = sideIncomeResult.length > 0 ? sideIncomeResult[0].total : 0;
        } catch (e) {
            console.log('Dashboard: Side income aggregation failed');
        }

        // Total expense = fixed monthly + current month operational
        const totalExpense = fixedExpense + operationalExpense;

        // NEW: Get monthly breakdown
        try {
            const monthlyData = await Bill.aggregate([
                {
                    $group: {
                        _id: { month: '$month', year: '$year' },
                        revenue: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'PAID'] }, '$finalAmount', 0]
                            }
                        },
                        pending: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'PENDING'] }, '$finalAmount', 0]
                            }
                        },
                        totalBills: { $sum: 1 }
                    }
                }
            ]);

            // Need to sort manually or via aggregation.
            // Mapping month name to number for sorting
            const monthMap = {
                'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
                'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
            };

            monthlyStats = monthlyData.map(stat => ({
                month: stat._id.month,
                year: stat._id.year,
                revenue: stat.revenue,
                pending: stat.pending,
                totalBills: stat.totalBills,
                monthNum: monthMap[stat._id.month] || 0
            }));

            // Sort by Year DESC, Month DESC
            monthlyStats.sort((a, b) => {
                if (b.year !== a.year) return b.year - a.year;
                return b.monthNum - a.monthNum;
            });

            // Clean up temporary property and limit to 6
            monthlyStats = monthlyStats.slice(0, 6).map(({ monthNum, ...rest }) => rest);

        } catch (e) {
            console.error('Dashboard: Failed to get monthly stats', e.message);
        }

        // NEW: Current month expense breakdown
        // Fixed expenses are always included (recurring monthly)
        currentMonthExpense.fixed = fixedExpense;
        currentMonthExpense.operational = operationalExpense;
        currentMonthExpense.total = fixedExpense + operationalExpense;

        // Total revenue = bills paid + side income
        const totalRevenue = revenue + sideIncome;

        res.json({
            stats: {
                students,
                staff,
                revenue: totalRevenue,
                billRevenue: revenue,
                sideIncome,
                pending,
                expense: totalExpense,
                fixedExpense,
                operationalExpense,
                netIncome: totalRevenue - totalExpense
            },
            monthlyStats,
            currentMonthExpense
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: 'Failed to load dashboard stats' });
    }
};

module.exports = { getDashboardStats };

