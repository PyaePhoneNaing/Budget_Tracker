import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import api from '../utils/api'
import { useRefresh } from '../contexts/RefreshContext'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency } from '../utils/currency'
import { format, isToday, isYesterday, parseISO, startOfDay } from 'date-fns'

const Transactions = () => {
  const { user } = useAuth()
  const { triggerRefresh, refreshKey } = useRefresh()
  const currency = user?.currency || 'USD'
  
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    categoryId: '',
  })
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    categoryId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  })
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)
  const fetchTimeoutRef = useRef(null)
  const isFetchingRef = useRef(false)

  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    fetchTimeoutRef.current = setTimeout(() => {
      if (!isFetchingRef.current) {
        fetchCategories()
        fetchTransactions()
      }
    }, 100)

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [filters, refreshKey])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data.categories)
    } catch (err) {
      if (err.response?.status !== 429) {
        console.error('Failed to fetch categories:', err)
      }
    }
  }


  const fetchTransactions = async (force = false) => {
    // Allow force refresh to bypass the check
    if (!force && isFetchingRef.current) return
    
    try {
      isFetchingRef.current = true
      setLoading(true)
      const params = {}
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
      if (filters.type) params.type = filters.type
      if (filters.categoryId) params.categoryId = filters.categoryId

      const response = await api.get('/transactions', { params })
      setTransactions(response.data.transactions)
      setError('')
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.')
        setTimeout(() => {
          isFetchingRef.current = false
          fetchTransactions(true)
        }, 2000)
        return
      }
      setError(err.response?.data?.error || 'Failed to load transactions')
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    
    try {
      setCreatingCategory(true)
      const response = await api.post('/categories', { name: newCategoryName.trim() })
      await fetchCategories()
      setFormData({ ...formData, categoryId: response.data.category.id })
      setNewCategoryName('')
      setShowNewCategoryInput(false)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to create category')
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}`, formData)
      } else {
        await api.post('/transactions', formData)
      }
      setShowForm(false)
      setEditingTransaction(null)
      setShowNewCategoryInput(false)
      setNewCategoryName('')
      setFormData({
        type: 'expense',
        amount: '',
        categoryId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: '',
      })
      // Force refresh immediately
      isFetchingRef.current = false
      await fetchTransactions(true)
      triggerRefresh() // Also refresh dashboard
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save transaction')
    }
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      categoryId: transaction.categoryId || '',
      date: format(new Date(transaction.date), 'yyyy-MM-dd'),
      note: transaction.note || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return

    try {
      await api.delete(`/transactions/${id}`)
      // Force refresh immediately
      isFetchingRef.current = false
      await fetchTransactions(true)
      triggerRefresh() // Also refresh dashboard
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete transaction')
    }
  }

  const formatAmount = (amount) => formatCurrency(amount, currency)

  // Group transactions by date
  const groupTransactionsByDate = (transactions) => {
    const grouped = {}
    
    transactions.forEach(transaction => {
      const dateKey = format(startOfDay(new Date(transaction.date)), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(transaction)
    })
    
    // Sort dates in descending order (newest first)
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(dateKey => ({
        date: dateKey,
        transactions: grouped[dateKey].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }))
  }

  // Format date header
  const formatDateHeader = (dateString) => {
    const date = parseISO(dateString)
    if (isToday(date)) {
      return 'Today'
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'EEEE, MMMM dd, yyyy')
    }
  }

  const groupedTransactions = groupTransactionsByDate(transactions)

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 animate-slideUp">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#7c3aed] mb-2">
              Transactions
            </h1>
            <p className="text-[#a0a0a0]">Manage your income and expenses</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditingTransaction(null)
              setFormData({
                type: 'expense',
                amount: '',
                categoryId: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                note: '',
              })
            }}
            className="bg-[#7c3aed] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#6d28d9] transition-all"
          >
            {showForm ? 'Cancel' : '+ Add Transaction'}
          </button>
        </div>

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

        {showForm && (
          <div className="mb-6 bg-[#141414] p-6 rounded-xl border border-[#262626] animate-fadeIn">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                    required
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Category</label>
                  <div className="space-y-2">
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                    >
                      <option value="">Select category (optional)</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {!showNewCategoryInput ? (
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryInput(true)}
                        className="text-sm text-[#7c3aed] hover:text-[#a78bfa] font-medium"
                      >
                        + Create new category
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                          placeholder="Category name"
                          className="flex-1 bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-3 py-2 text-sm focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={creatingCategory || !newCategoryName.trim()}
                          className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {creatingCategory ? '...' : 'Add'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCategoryInput(false)
                            setNewCategoryName('')
                          }}
                          className="bg-[#1a1a1a] text-[#a0a0a0] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#262626] border border-[#262626] transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                  rows="3"
                  placeholder="Add a note (optional)"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-[#7c3aed] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#6d28d9] transition-all"
                >
                  {editingTransaction ? 'Update' : 'Add'} Transaction
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingTransaction(null)
                  }}
                  className="bg-[#1a1a1a] text-[#a0a0a0] px-6 py-2.5 rounded-lg font-medium hover:bg-[#262626] border border-[#262626] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-6 bg-[#141414] p-5 rounded-xl border border-[#262626]">
          <h3 className="text-xl font-bold text-white mb-4">Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-3 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-3 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-3 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Category</label>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-3 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c3aed] mb-4"></div>
            <p className="text-[#a0a0a0]">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-[#141414] p-12 rounded-xl border border-[#262626] text-center">
            <p className="text-xl font-semibold text-[#a0a0a0] mb-2">No transactions found</p>
            <p className="text-[#666]">Add your first transaction to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTransactions.map(({ date, transactions: dateTransactions }) => (
              <div key={date} className="bg-[#141414] shadow-lg overflow-hidden rounded-xl border border-[#262626]">
                {/* Date Header */}
                <div className="bg-[#1a1a1a] border-b border-[#262626] px-6 py-4">
                  <h3 className="text-lg font-semibold text-[#7c3aed]">
                    {formatDateHeader(date)}
                  </h3>
                  <p className="text-sm text-[#666] mt-1">
                    {dateTransactions.length} {dateTransactions.length === 1 ? 'transaction' : 'transactions'}
                  </p>
                </div>
                
                {/* Transactions for this date */}
                <ul className="divide-y divide-[#262626]">
                  {dateTransactions.map((transaction) => (
                    <li key={transaction.id} className="px-6 py-5 hover:bg-[#1a1a1a] transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              transaction.type === 'income' 
                                ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30' 
                                : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
                            }`}>
                              {transaction.type === 'income' ? '💰' : '💸'} {transaction.type}
                            </span>
                            {transaction.category && (
                              <span className="text-sm font-medium text-[#a0a0a0] bg-[#1a1a1a] px-3 py-1 rounded-full border border-[#262626]">
                                {transaction.category.name}
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-2xl font-bold text-white">
                              {formatAmount(transaction.amount)}
                            </p>
                            {transaction.note && (
                              <p className="text-sm text-[#a0a0a0] mt-2">{transaction.note}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 sm:flex-row">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="bg-[#1a1a1a] text-[#7c3aed] px-4 py-2 rounded-lg hover:bg-[#262626] font-medium text-sm transition-colors border border-[#262626]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="bg-[#1a1a1a] text-[#ef4444] px-4 py-2 rounded-lg hover:bg-[#262626] font-medium text-sm transition-colors border border-[#262626]"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Transactions
