import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="bg-[#141414]/80 backdrop-blur-xl border-b border-[#262626] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-[#7c3aed]">
                  Budget Tracker
                </h1>
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
                <Link
                  to="/dashboard"
                  className="text-[#a0a0a0] hover:text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a1a1a] transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  to="/transactions"
                  className="text-[#a0a0a0] hover:text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a1a1a] transition-all"
                >
                  Transactions
                </Link>
                <Link
                  to="/categories"
                  className="text-[#a0a0a0] hover:text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a1a1a] transition-all"
                >
                  Categories
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 text-[#a0a0a0] hover:text-white transition-colors"
              >
                {user?.profilePhoto ? (
                  <img 
                    src={`http://localhost:3001${user.profilePhoto}`} 
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#262626]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#262626] flex items-center justify-center text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium">{user?.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-[#7c3aed] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
