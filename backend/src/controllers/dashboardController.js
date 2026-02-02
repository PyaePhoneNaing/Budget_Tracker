import prisma from '../config/database.js';
import { getCache, setCache, getDashboardCacheKey } from '../utils/cache.js';

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const cacheKey = getDashboardCacheKey(userId) + (startDate || endDate ? `:${startDate}:${endDate}` : '');

    // Try to get from cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    // Get all transactions for user
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        ...dateFilter,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate totals - only income and expense
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const remainingBalance = totalIncome - totalExpense;

    // Spending by category - only expenses
    const spendingByCategory = {};
    transactions
      .filter(t => t.type === 'expense' && t.category)
      .forEach(t => {
        const catName = t.category.name;
        spendingByCategory[catName] = (spendingByCategory[catName] || 0) + t.amount;
      });

    // Daily spending trend (last 30 days) - only expenses
    const dailyTrend = {};
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= thirtyDaysAgo)
      .forEach(t => {
        const dateKey = new Date(t.date).toISOString().split('T')[0];
        dailyTrend[dateKey] = (dailyTrend[dateKey] || 0) + t.amount;
      });

    // Format daily trend as array
    const dailyTrendArray = Object.entries(dailyTrend)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const result = {
      summary: {
        totalIncome,
        totalExpense,
        remainingBalance,
        transactionCount: transactions.length,
      },
      spendingByCategory,
      dailyTrend: dailyTrendArray,
    };

    // Cache the result
    await setCache(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
