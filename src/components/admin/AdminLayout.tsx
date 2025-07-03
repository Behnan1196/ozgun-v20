'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  LibraryBooks,
  Announcement,
  Settings as SettingsIcon,
  Logout,
  School,
  Subject,
  Link,
  Upload,
  Visibility,
  VisibilityOff,
  Palette,
  Camera,
  Person,
  Shield,
  Language,
  Phone,
  DarkMode,
  LightMode,
  Computer,
  Notifications,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { ProfileAvatar } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'

const drawerWidth = 240

interface AdminLayoutProps {
  children: React.ReactNode
  currentPage: string
}

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
  { text: 'Kullanıcı Yönetimi', icon: <People />, path: '/admin/users' },
  { text: 'Konu Yönetimi', icon: <Subject />, path: '/admin/subjects' },
  { text: 'Kaynak Yönetimi', icon: <LibraryBooks />, path: '/admin/resources' },
  { text: 'Yararlı Linkler', icon: <Link />, path: '/admin/links' },
  { text: 'Duyuru Yönetimi', icon: <Announcement />, path: '/admin/announcements' },
  { text: 'Sistem Ayarları', icon: <SettingsIcon />, path: '/admin/settings' },
]

export default function AdminLayout({ children, currentPage }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settingsTab, setSettingsTab] = useState('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [settingsForm, setSettingsForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    theme: 'system', // light, dark, system
    language: 'tr',
    notifications_enabled: true,
    email_notifications: true,
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setIsLoadingProfile(false)
          return
        }

        // Load both user and profile data simultaneously
        const [{ data: profile }] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        ])

        // Set both at the same time to avoid flickering
        setUser(user)
        setProfile(profile)
        setIsLoadingProfile(false)
      } catch (error) {
        console.error('Error loading user data:', error)
        setIsLoadingProfile(false)
      }
    }

    loadUser()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (anchorEl && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAnchorEl(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [anchorEl])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
      window.location.href = '/login'
    }
  }

  // Settings Modal Functions
  const openSettingsModal = () => {
    // Populate form with current user data
    setSettingsForm({
      full_name: profile?.full_name || '',
      email: user?.email || '',
      phone: profile?.phone || '',
      avatar_url: profile?.avatar_url || '',
      theme: profile?.theme || 'system',
      language: profile?.language || 'tr',
      notifications_enabled: profile?.notifications_enabled !== false,
      email_notifications: profile?.email_notifications !== false,
      current_password: '',
      new_password: '',
      confirm_password: ''
    })
    setAvatarPreview(profile?.avatar_url || null)
    setShowSettingsModal(true)
    setAnchorEl(null) // Close user dropdown
  }

  const closeSettingsModal = () => {
    setShowSettingsModal(false)
    setSettingsTab('profile')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setAvatarPreview(null)
    setSettingsForm({
      full_name: '',
      email: '',
      phone: '',
      avatar_url: '',
      theme: 'system',
      language: 'tr',
      notifications_enabled: true,
      email_notifications: true,
      current_password: '',
      new_password: '',
      confirm_password: ''
    })
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır.')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        setSettingsForm((prev: any) => ({ ...prev, avatar_url: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    setSettingsForm((prev: any) => ({ ...prev, avatar_url: null }))
  }

  const updateProfile = async () => {
    try {
      const supabase = createClient()
      
      // If avatar_url is null, we need to remove the avatar from storage
      if (profile?.avatar_url && !settingsForm.avatar_url) {
        const avatarPath = profile.avatar_url.split('/').pop()
        if (avatarPath) {
          await supabase.storage.from('avatars').remove([avatarPath])
        }
      }
      
      const updates = {
        full_name: settingsForm.full_name,
        phone: settingsForm.phone,
        avatar_url: settingsForm.avatar_url,
        theme: settingsForm.theme,
        language: settingsForm.language,
        notifications_enabled: settingsForm.notifications_enabled,
        email_notifications: settingsForm.email_notifications,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        alert('Profil güncellenirken hata oluştu: ' + error.message)
        return
      }

      // Update local state
      setProfile((prev: any) => ({ ...prev, ...updates }))
      alert('Profil başarıyla güncellendi!')
      
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Profil güncellenirken hata oluştu.')
    }
  }

  const updatePassword = async () => {
    if (settingsForm.new_password !== settingsForm.confirm_password) {
      alert('Yeni şifreler eşleşmiyor!')
      return
    }

    if (settingsForm.new_password.length < 6) {
      alert('Yeni şifre en az 6 karakter olmalıdır!')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: settingsForm.new_password
      })

      if (error) {
        console.error('Error updating password:', error)
        alert('Şifre güncellenirken hata oluştu: ' + error.message)
        return
      }

      alert('Şifre başarıyla güncellendi!')
      setSettingsForm((prev: any) => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }))
      
    } catch (error) {
      console.error('Error updating password:', error)
      alert('Şifre güncellenirken hata oluştu.')
    }
  }

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <School sx={{ color: 'primary.main' }} />
          <Typography variant="h6" noWrap component="div">
            TYT AYT Admin
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={currentPage === item.path || (currentPage === 'links' && item.path === '/admin/links')}
              onClick={() => router.push(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            TYT AYT Koçluk Sistemi - Admin Panel
          </Typography>
          {/* User Avatar with Dropdown - Matching Coach Interface */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={handleMenuOpen}
              className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-800 overflow-hidden"
              title={profile?.full_name || 'Admin'}
            >
              {isLoadingProfile ? (
                <span className="text-sm font-medium">•</span>
              ) : profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile?.full_name || 'Admin'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              )}
            </button>
            
            {/* Dropdown Menu - Dark Theme matching Coach Interface */}
            {Boolean(anchorEl) && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-md shadow-xl py-1 z-50 border border-slate-600">
                <div className="px-4 py-2 text-sm text-gray-200 border-b border-slate-600">
                  <div className="font-medium">{isLoadingProfile ? 'Yükleniyor...' : (profile?.full_name || 'Admin')}</div>
                  <div className="text-xs text-gray-400">Admin</div>
                </div>
                <button
                  onClick={openSettingsModal}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-slate-600"
                >
                  <SettingsIcon style={{ height: '16px', width: '16px', marginRight: '8px' }} />
                  Ayarlar
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-600"
                >
                  <Logout style={{ height: '16px', width: '16px', marginRight: '8px' }} />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Settings Modal - Identical to Coach Interface */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '896px',
            margin: '16px',
            maxHeight: '90vh',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                margin: 0
              }}>
                <SettingsIcon style={{ height: '20px', width: '20px', marginRight: '8px', color: '#2563eb' }} />
                Kullanıcı Ayarları
              </h2>
              <button
                onClick={closeSettingsModal}
                style={{
                  color: '#9ca3af',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', height: '600px' }}>
              {/* Settings Sidebar */}
              <div style={{
                width: '256px',
                backgroundColor: '#f9fafb',
                borderRight: '1px solid #e5e7eb',
                padding: '16px'
              }}>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => setSettingsTab('profile')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      border: settingsTab === 'profile' ? '1px solid #dbeafe' : 'none',
                      backgroundColor: settingsTab === 'profile' ? '#dbeafe' : 'transparent',
                      color: settingsTab === 'profile' ? '#1d4ed8' : '#4b5563',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (settingsTab !== 'profile') e.currentTarget.style.backgroundColor = '#f3f4f6'
                    }}
                    onMouseLeave={(e) => {
                      if (settingsTab !== 'profile') e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <Person style={{ height: '16px', width: '16px', marginRight: '12px' }} />
                    Profil Bilgileri
                  </button>
                  <button
                    onClick={() => setSettingsTab('security')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      border: settingsTab === 'security' ? '1px solid #dbeafe' : 'none',
                      backgroundColor: settingsTab === 'security' ? '#dbeafe' : 'transparent',
                      color: settingsTab === 'security' ? '#1d4ed8' : '#4b5563',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (settingsTab !== 'security') e.currentTarget.style.backgroundColor = '#f3f4f6'
                    }}
                    onMouseLeave={(e) => {
                      if (settingsTab !== 'security') e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <Shield style={{ height: '16px', width: '16px', marginRight: '12px' }} />
                    Güvenlik
                  </button>
                  <button
                    onClick={() => setSettingsTab('appearance')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      border: settingsTab === 'appearance' ? '1px solid #dbeafe' : 'none',
                      backgroundColor: settingsTab === 'appearance' ? '#dbeafe' : 'transparent',
                      color: settingsTab === 'appearance' ? '#1d4ed8' : '#4b5563',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (settingsTab !== 'appearance') e.currentTarget.style.backgroundColor = '#f3f4f6'
                    }}
                    onMouseLeave={(e) => {
                      if (settingsTab !== 'appearance') e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <Palette style={{ height: '16px', width: '16px', marginRight: '12px' }} />
                    Görünüm
                  </button>
                  <button
                    onClick={() => setSettingsTab('notifications')}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      border: settingsTab === 'notifications' ? '1px solid #dbeafe' : 'none',
                      backgroundColor: settingsTab === 'notifications' ? '#dbeafe' : 'transparent',
                      color: settingsTab === 'notifications' ? '#1d4ed8' : '#4b5563',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (settingsTab !== 'notifications') e.currentTarget.style.backgroundColor = '#f3f4f6'
                    }}
                    onMouseLeave={(e) => {
                      if (settingsTab !== 'notifications') e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <Notifications style={{ height: '16px', width: '16px', marginRight: '12px' }} />
                    Bildirimler
                  </button>
                </nav>
              </div>

              {/* Settings Content */}
              <div style={{
                flex: 1,
                padding: '24px',
                overflowY: 'auto'
              }}>
                {/* Profile Settings */}
                {settingsTab === 'profile' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '500',
                        color: '#1f2937',
                        marginBottom: '16px'
                      }}>Profil Bilgileri</h3>
                      
                      {/* Avatar Section */}
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '12px'
                        }}>
                          Profil Fotoğrafı
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <ProfileAvatar
                            src={avatarPreview || profile?.avatar_url}
                            fallback={profile?.full_name}
                            onUpload={(file: File) => handleAvatarUpload({ target: { files: [file] } } as any)}
                            onRemove={handleRemoveAvatar}
                          />
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            <p>JPG, PNG veya GIF formatında</p>
                            <p>Maksimum 5MB</p>
                          </div>
                        </div>
                      </div>

                      {/* Profile Form */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '16px'
                      }}>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                          }}>
                            Ad Soyad
                          </label>
                          <input
                            type="text"
                            value={settingsForm.full_name}
                            onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, full_name: e.target.value }))}
                            style={{
                              width: '100%',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '14px',
                              outline: 'none',
                              transition: 'border-color 0.2s'
                            }}
                            placeholder="Ad Soyad"
                            onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                          />
                        </div>
                        
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                          }}>
                            E-posta
                          </label>
                          <input
                            type="email"
                            value={settingsForm.email}
                            disabled
                            style={{
                              width: '100%',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '14px',
                              backgroundColor: '#f3f4f6',
                              color: '#6b7280'
                            }}
                            placeholder="E-posta adresi"
                          />
                          <p style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            marginTop: '4px'
                          }}>E-posta adresi değiştirilemez</p>
                        </div>
                        
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px'
                          }}>
                            Telefon
                          </label>
                          <input
                            type="tel"
                            value={settingsForm.phone}
                            onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, phone: e.target.value }))}
                            style={{
                              width: '100%',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '14px',
                              outline: 'none',
                              transition: 'border-color 0.2s'
                            }}
                            placeholder="Telefon numarası"
                            onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button
                          onClick={updateProfile}
                          style={{
                            padding: '8px 24px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        >
                          Profili Güncelle
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {settingsTab === 'security' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '500',
                        color: '#1f2937',
                        marginBottom: '16px'
                      }}>Güvenlik Ayarları</h3>
                      
                      {/* Password Change */}
                      <div style={{
                        backgroundColor: '#fefce8',
                        border: '1px solid #fde047',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '24px'
                      }}>
                        <h4 style={{
                          fontWeight: '500',
                          color: '#a16207',
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <Shield style={{ height: '16px', width: '16px', marginRight: '8px' }} />
                          Şifre Değiştir
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#374151',
                              marginBottom: '4px'
                            }}>
                              Mevcut Şifre
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={settingsForm.current_password}
                                onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, current_password: e.target.value }))}
                                style={{
                                  width: '100%',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  padding: '8px 40px 8px 12px',
                                  fontSize: '14px',
                                  outline: 'none',
                                  transition: 'border-color 0.2s'
                                }}
                                placeholder="Mevcut şifrenizi girin"
                                onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                style={{
                                  position: 'absolute',
                                  right: '12px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: '#9ca3af',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                              >
                                {showCurrentPassword ? <VisibilityOff style={{ height: '16px', width: '16px' }} /> : <Visibility style={{ height: '16px', width: '16px' }} />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#374151',
                              marginBottom: '4px'
                            }}>
                              Yeni Şifre
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type={showNewPassword ? "text" : "password"}
                                value={settingsForm.new_password}
                                onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, new_password: e.target.value }))}
                                style={{
                                  width: '100%',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  padding: '8px 40px 8px 12px',
                                  fontSize: '14px',
                                  outline: 'none',
                                  transition: 'border-color 0.2s'
                                }}
                                placeholder="Yeni şifrenizi girin"
                                onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                style={{
                                  position: 'absolute',
                                  right: '12px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: '#9ca3af',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                              >
                                {showNewPassword ? <VisibilityOff style={{ height: '16px', width: '16px' }} /> : <Visibility style={{ height: '16px', width: '16px' }} />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label style={{
                              display: 'block',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#374151',
                              marginBottom: '4px'
                            }}>
                              Yeni Şifre Tekrar
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={settingsForm.confirm_password}
                                onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, confirm_password: e.target.value }))}
                                style={{
                                  width: '100%',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  padding: '8px 40px 8px 12px',
                                  fontSize: '14px',
                                  outline: 'none',
                                  transition: 'border-color 0.2s'
                                }}
                                placeholder="Yeni şifrenizi tekrar girin"
                                onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{
                                  position: 'absolute',
                                  right: '12px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: '#9ca3af',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                              >
                                {showConfirmPassword ? <VisibilityOff style={{ height: '16px', width: '16px' }} /> : <Visibility style={{ height: '16px', width: '16px' }} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                          <button
                            onClick={updatePassword}
                            disabled={!settingsForm.current_password || !settingsForm.new_password || !settingsForm.confirm_password}
                            style={{
                              padding: '8px 24px',
                              backgroundColor: !settingsForm.current_password || !settingsForm.new_password || !settingsForm.confirm_password ? '#d1d5db' : '#d97706',
                              color: 'white',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: !settingsForm.current_password || !settingsForm.new_password || !settingsForm.confirm_password ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (!(!settingsForm.current_password || !settingsForm.new_password || !settingsForm.confirm_password)) {
                                e.currentTarget.style.backgroundColor = '#b45309'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!(!settingsForm.current_password || !settingsForm.new_password || !settingsForm.confirm_password)) {
                                e.currentTarget.style.backgroundColor = '#d97706'
                              }
                            }}
                          >
                            Şifreyi Güncelle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Settings */}
                {settingsTab === 'appearance' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '500',
                        color: '#1f2937',
                        marginBottom: '16px'
                      }}>Görünüm Ayarları</h3>
                      
                      {/* Theme Selection */}
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '12px'
                        }}>
                          Tema Seçimi
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <input
                              type="radio"
                              name="theme"
                              value="light"
                              checked={settingsForm.theme === 'light'}
                              onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, theme: e.target.value }))}
                              style={{ accentColor: '#2563eb', marginRight: '12px' }}
                            />
                            <LightMode style={{ height: '16px', width: '16px', marginRight: '8px', color: '#f59e0b' }} />
                            <span>Açık Tema</span>
                          </label>
                          
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <input
                              type="radio"
                              name="theme"
                              value="dark"
                              checked={settingsForm.theme === 'dark'}
                              onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, theme: e.target.value }))}
                              style={{ accentColor: '#2563eb', marginRight: '12px' }}
                            />
                            <DarkMode style={{ height: '16px', width: '16px', marginRight: '8px', color: '#2563eb' }} />
                            <span>Koyu Tema</span>
                          </label>
                          
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <input
                              type="radio"
                              name="theme"
                              value="system"
                              checked={settingsForm.theme === 'system'}
                              onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, theme: e.target.value }))}
                              style={{ accentColor: '#2563eb', marginRight: '12px' }}
                            />
                            <Computer style={{ height: '16px', width: '16px', marginRight: '8px', color: '#6b7280' }} />
                            <span>Sistem Ayarı</span>
                          </label>
                        </div>
                      </div>

                      {/* Language Selection */}
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '12px'
                        }}>
                          Dil Seçimi
                        </label>
                        <select
                          value={settingsForm.language}
                          onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, language: e.target.value }))}
                          style={{
                            width: '100%',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                        >
                          <option value="tr">Türkçe</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={updateProfile}
                          style={{
                            padding: '8px 24px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        >
                          Görünüm Ayarlarını Kaydet
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {settingsTab === 'notifications' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '500',
                        color: '#1f2937',
                        marginBottom: '16px'
                      }}>Bildirim Ayarları</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px'
                        }}>
                          <div>
                            <h4 style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 4px 0' }}>Genel Bildirimler</h4>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Sistem bildirimleri ve güncellemeler</p>
                          </div>
                          <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={settingsForm.notifications_enabled}
                              onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, notifications_enabled: e.target.checked }))}
                              style={{ display: 'none' }}
                            />
                            <div style={{
                              width: '44px',
                              height: '24px',
                              backgroundColor: settingsForm.notifications_enabled ? '#2563eb' : '#d1d5db',
                              borderRadius: '12px',
                              position: 'relative',
                              transition: 'background-color 0.2s'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: settingsForm.notifications_enabled ? '22px' : '2px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                transition: 'left 0.2s'
                              }} />
                            </div>
                          </label>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px'
                        }}>
                          <div>
                            <h4 style={{ fontWeight: '500', color: '#1f2937', margin: '0 0 4px 0' }}>E-posta Bildirimleri</h4>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Önemli güncellemeler e-posta ile gönderilsin</p>
                          </div>
                          <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={settingsForm.email_notifications}
                              onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, email_notifications: e.target.checked }))}
                              style={{ display: 'none' }}
                            />
                            <div style={{
                              width: '44px',
                              height: '24px',
                              backgroundColor: settingsForm.email_notifications ? '#2563eb' : '#d1d5db',
                              borderRadius: '12px',
                              position: 'relative',
                              transition: 'background-color 0.2s'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: settingsForm.email_notifications ? '22px' : '2px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                transition: 'left 0.2s'
                              }} />
                            </div>
                          </label>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button
                          onClick={updateProfile}
                          style={{
                            padding: '8px 24px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        >
                          Bildirim Ayarlarını Kaydet
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Box>
  )
} 