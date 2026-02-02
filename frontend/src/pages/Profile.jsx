import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useRefresh } from '../contexts/RefreshContext'
import { CURRENCIES } from '../utils/currency'

const Profile = () => {
  const { user: authUser, updateUser } = useAuth()
  const { triggerRefresh } = useRefresh()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'password', 'photo'
  
  // Profile form
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currency: 'USD',
  })
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  // Photo upload
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/auth/profile')
      const userData = response.data.user
      setUser(userData)
      setProfileData({
        name: userData.name,
        email: userData.email,
        currency: userData.currency || 'USD',
      })
      if (userData.profilePhoto) {
        setPhotoPreview(`http://localhost:3001${userData.profilePhoto}`)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      const response = await api.put('/profile', profileData)
      const updatedUser = response.data.user
      setUser(updatedUser)
      updateUser(updatedUser) // Update auth context
      setSuccess('Profile updated successfully')
      triggerRefresh()
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to update profile')
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match')
        return
      }

      await api.put('/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      
      setSuccess('Password updated successfully')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to update password')
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoUpload = async () => {
    if (!photoFile) return

    try {
      setUploading(true)
      setError('')
      setSuccess('')
      
      const formData = new FormData()
      formData.append('photo', photoFile)

      const response = await api.post('/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      const updatedUser = response.data.user
      setUser(updatedUser)
      updateUser(updatedUser) // Update auth context
      if (updatedUser.profilePhoto) {
        setPhotoPreview(`http://localhost:3001${updatedUser.profilePhoto}`)
      }
      setSuccess('Profile photo updated successfully')
      setPhotoFile(null)
      triggerRefresh()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async () => {
    if (!window.confirm('Are you sure you want to delete your profile photo?')) return

    try {
      setError('')
      setSuccess('')
      await api.delete('/profile/photo')
      const updatedUser = { ...user, profilePhoto: null }
      setUser(updatedUser)
      updateUser(updatedUser) // Update auth context
      setPhotoPreview(null)
      setPhotoFile(null)
      setSuccess('Profile photo deleted successfully')
      triggerRefresh()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete photo')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c3aed]"></div>
            <div className="text-lg text-[#a0a0a0]">Loading profile...</div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0 animate-slideUp">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#7c3aed] mb-2">
            Profile Settings
          </h1>
          <p className="text-[#a0a0a0]">Manage your account information</p>
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

        {success && (
          <div className="mb-4 bg-[#1a1a1a] border-l-4 border-[#10b981] text-[#10b981] p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-[#262626]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-[#7c3aed] border-b-2 border-[#7c3aed]'
                : 'text-[#a0a0a0] hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'password'
                ? 'text-[#7c3aed] border-b-2 border-[#7c3aed]'
                : 'text-[#a0a0a0] hover:text-white'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setActiveTab('photo')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'photo'
                ? 'text-[#7c3aed] border-b-2 border-[#7c3aed]'
                : 'text-[#a0a0a0] hover:text-white'
            }`}
          >
            Photo
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-[#141414] p-6 rounded-xl border border-[#262626]">
            <h2 className="text-2xl font-bold text-white mb-6">Update Profile</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Currency</label>
                <select
                  value={profileData.currency}
                  onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                  required
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name} ({curr.symbol})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#666] mt-1">This will be used to display all amounts throughout the app</p>
              </div>
              <button
                type="submit"
                className="bg-[#7c3aed] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#6d28d9] transition-all"
              >
                Update Profile
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-[#141414] p-6 rounded-xl border border-[#262626]">
            <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                className="bg-[#7c3aed] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#6d28d9] transition-all"
              >
                Update Password
              </button>
            </form>
          </div>
        )}

        {/* Photo Tab */}
        {activeTab === 'photo' && (
          <div className="bg-[#141414] p-6 rounded-xl border border-[#262626]">
            <h2 className="text-2xl font-bold text-white mb-6">Profile Photo</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-full bg-[#1a1a1a] border-2 border-[#262626] flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-4xl text-[#666]">👤</div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Upload Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-4 py-2.5 focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                  />
                  <p className="text-xs text-[#666] mt-1">Max file size: 5MB. Accepted formats: JPG, PNG, GIF</p>
                </div>
              </div>
              <div className="flex gap-3">
                {photoFile && (
                  <button
                    onClick={handlePhotoUpload}
                    disabled={uploading}
                    className="bg-[#7c3aed] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#6d28d9] transition-all disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </button>
                )}
                {user?.profilePhoto && (
                  <button
                    onClick={handleDeletePhoto}
                    className="bg-[#1a1a1a] text-[#ef4444] px-6 py-2.5 rounded-lg font-medium hover:bg-[#262626] border border-[#262626] transition-colors"
                  >
                    Delete Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Profile
