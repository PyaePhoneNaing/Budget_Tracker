import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import api from '../utils/api'
import { useRefresh } from '../contexts/RefreshContext'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency } from '../utils/currency'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#e9d5ff', '#f3e8ff']

const Dashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const { refreshKey } = useRefresh()
  const fetchTimeoutRef = useRef(null)
  const isFetchingRef = useRef(false)
  
  const currency = user?.currency || 'USD'

  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    // If refreshKey changes, force immediate refresh
    const isRefresh = refreshKey > 0
    const delay = isRefresh ? 0 : 100

    fetchTimeoutRef.current = setTimeout(() => {
      fetchDashboard(isRefresh)
    }, delay)

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [startDate, endDate, refreshKey])

  const fetchDashboard = async (force = false) => {
    // Allow force refresh to bypass the check
    if (!force && isFetchingRef.current) return
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isFetchingRef.current) {
        console.warn('Dashboard fetch timeout, resetting state')
        setLoading(false)
        isFetchingRef.current = false
        if (!dashboardData) {
          setDashboardData({
            summary: { totalIncome: 0, totalExpense: 0, remainingBalance: 0, transactionCount: 0 },
            spendingByCategory: {},
            dailyTrend: []
          })
        }
      }
    }, 10000) // 10 second timeout
    
    try {
      isFetchingRef.current = true
      setLoading(true)
      setError('')
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      
      const response = await api.get('/dashboard', { params })
      clearTimeout(timeoutId)
      setDashboardData(response.data)
      setError('') // Clear any previous errors
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('Dashboard error:', err)
      
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and refresh the page.')
        setTimeout(() => {
          isFetchingRef.current = false
          fetchDashboard(true)
        }, 2000)
        return
      }
      
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load dashboard'
      setError(errorMessage)
      // Always set empty data on error so UI doesn't stay in loading state
      setDashboardData({
        summary: { totalIncome: 0, totalExpense: 0, remainingBalance: 0, transactionCount: 0 },
        spendingByCategory: {},
        dailyTrend: []
      })
    } finally {
      // Always set loading to false, even on error
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  const formatAmount = (amount) => formatCurrency(amount, currency)

  // Only show loading spinner on initial load (when no data exists)
  if (loading && !dashboardData) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c3aed]"></div>
            <div className="text-lg text-[#a0a0a0]">Loading dashboard...</div>
          </div>
        </div>
      </Layout>
    )
  }

  // If we have data (even if empty), show the dashboard
  // This prevents infinite loading state

  const { summary, spendingByCategory, dailyTrend } = dashboardData || {}

  const categoryData = Object.entries(spendingByCategory || {}).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2)),
  }))

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 animate-slideUp">
        {error && (
          <div className="mb-4 bg-[#1a1a1a] border-l-4 border-[#ef4444] text-[#ef4444] p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#7c3aed] mb-2">
            Dashboard
          </h1>
          <p className="text-[#a0a0a0]">Track your budget and expenses in real-time</p>
        </div>

        {/* Date Filters */}
        <div className="mb-6 bg-[#141414] p-5 rounded-xl border border-[#262626]">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                }}
                className="px-5 py-2.5 bg-[#1a1a1a] text-[#a0a0a0] rounded-lg hover:bg-[#262626] font-medium transition-colors border border-[#262626]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#10b981]/20 to-[#059669]/20 border border-[#10b981]/30 rounded-xl p-6 hover:border-[#10b981]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-[#a0a0a0] mb-2">Total Income</p>
                <p className="text-3xl font-bold text-[#10b981]">
                  {formatAmount(summary?.totalIncome || 0)}
                </p>
              </div>
              <div className="bg-[#10b981]/10 rounded-lg p-3 group-hover:bg-[#10b981]/20 transition-colors">
                <svg className="w-6 h-6 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#ef4444]/20 to-[#dc2626]/20 border border-[#ef4444]/30 rounded-xl p-6 hover:border-[#ef4444]/50 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-[#a0a0a0] mb-2">Total Expenses</p>
                <p className="text-3xl font-bold text-[#ef4444]">
                  {formatAmount(summary?.totalExpense || 0)}
                </p>
              </div>
              <div className="bg-[#ef4444]/10 rounded-lg p-3 group-hover:bg-[#ef4444]/20 transition-colors">
                <svg className="w-6 h-6 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
            </div>
          </div>

          <div className={`bg-[#1a1a1a] ${(summary?.remainingBalance || 0) >= 0 ? 'border-[#7c3aed]/30' : 'border-[#666]/30'} border rounded-xl p-6 hover:border-opacity-50 transition-all group`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium text-[#a0a0a0] mb-2`}>Remaining Balance</p>
                <p className={`text-3xl font-bold ${(summary?.remainingBalance || 0) >= 0 ? 'text-[#7c3aed]' : 'text-[#a0a0a0]'}`}>
                  {formatAmount(summary?.remainingBalance || 0)}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${(summary?.remainingBalance || 0) >= 0 ? 'bg-[#7c3aed]/10 group-hover:bg-[#7c3aed]/20' : 'bg-[#666]/10 group-hover:bg-[#666]/20'} transition-colors`}>
                <svg className={`w-6 h-6 ${(summary?.remainingBalance || 0) >= 0 ? 'text-[#7c3aed]' : 'text-[#a0a0a0]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {categoryData.length > 0 && (
            <div className="bg-[#141414] p-6 rounded-xl border border-[#262626]">
              <h2 className="text-xl font-bold text-white mb-6">Spending by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#7c3aed"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                      formatter={(value) => formatAmount(value)}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #262626', borderRadius: '8px', color: '#e5e5e5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {dailyTrend && dailyTrend.length > 0 && (
            <div className="bg-[#141414] p-6 rounded-xl border border-[#262626]">
              <h2 className="text-xl font-bold text-white mb-6">Daily Spending Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#666"
                    tick={{ fill: '#a0a0a0' }}
                  />
                  <YAxis 
                    stroke="#666"
                    tick={{ fill: '#a0a0a0' }}
                  />
                  <Tooltip 
                      formatter={(value) => formatAmount(value)}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #262626', borderRadius: '8px', color: '#e5e5e5' }}
                  />
                  <Legend wrapperStyle={{ color: '#a0a0a0' }} />
                  <Bar dataKey="amount" fill="#7c3aed" name="Spending" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {categoryData.length === 0 && dailyTrend.length === 0 && (
          <div className="bg-[#141414] p-12 rounded-xl border border-[#262626] text-center">
            <p className="text-xl font-semibold text-[#a0a0a0] mb-2">No data available yet</p>
            <p className="text-[#666]">Start adding transactions to see your dashboard come to life</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
