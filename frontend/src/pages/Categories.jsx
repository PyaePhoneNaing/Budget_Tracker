import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../utils/api'
import { useRefresh } from '../contexts/RefreshContext'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '' })
  const { triggerRefresh } = useRefresh()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get('/categories')
      setCategories(response.data.categories)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData)
      } else {
        await api.post('/categories', formData)
      }
      setShowForm(false)
      setEditingCategory(null)
      setFormData({ name: '' })
      await fetchCategories()
      triggerRefresh() // Refresh other pages
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save category')
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({ name: category.name })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Transactions using this category will have their category removed.')) return

    try {
      await api.delete(`/categories/${id}`)
      await fetchCategories()
      triggerRefresh()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete category')
    }
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 animate-slideUp">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#7c3aed] mb-2">
              Categories
            </h1>
            <p className="text-[#a0a0a0]">Manage your transaction categories</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditingCategory(null)
              setFormData({ name: '' })
            }}
            className="bg-[#7c3aed] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#6d28d9] transition-all"
          >
            {showForm ? 'Cancel' : '+ Add Category'}
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
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                  placeholder="Enter category name"
                  required
                  maxLength={50}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="bg-[#7c3aed] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#6d28d9] transition-all"
                >
                  {editingCategory ? 'Update' : 'Add'} Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingCategory(null)
                    setFormData({ name: '' })
                  }}
                  className="bg-[#1a1a1a] text-[#a0a0a0] px-6 py-2.5 rounded-lg font-medium hover:bg-[#262626] border border-[#262626] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c3aed] mb-4"></div>
            <p className="text-[#a0a0a0]">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-[#141414] p-12 rounded-xl border border-[#262626] text-center">
            <p className="text-xl font-semibold text-[#a0a0a0] mb-2">No categories found</p>
            <p className="text-[#666]">Add your first category to get started</p>
          </div>
        ) : (
          <div className="bg-[#141414] shadow-lg overflow-hidden rounded-xl border border-[#262626]">
            <ul className="divide-y divide-[#262626]">
              {categories.map((category) => (
                <li key={category.id} className="px-6 py-5 hover:bg-[#1a1a1a] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-white">{category.name}</p>
                      <p className="text-sm text-[#666] mt-1">
                        Created {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="bg-[#1a1a1a] text-[#7c3aed] px-4 py-2 rounded-lg hover:bg-[#262626] font-medium text-sm transition-colors border border-[#262626]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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
        )}
      </div>
    </Layout>
  )
}

export default Categories
