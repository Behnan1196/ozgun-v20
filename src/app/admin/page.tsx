'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material'
import {
  People,
  School,
  Assignment,
  Announcement,
} from '@mui/icons-material'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types/database'

interface DashboardStats {
  totalUsers: number
  totalCoaches: number
  totalStudents: number
  totalTasks: number
  totalAnnouncements: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCoaches: 0,
    totalStudents: 0,
    totalTasks: 0,
    totalAnnouncements: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/login')
          return
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!profile || profile.role !== 'admin') {
          router.push('/login')
          return
        }

        setCurrentUser(profile)
        await loadStats()
        setLoading(false)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  const loadStats = async () => {
    const supabase = createClient()

    try {
      // Get user counts
      const { data: allUsers } = await supabase
        .from('user_profiles')
        .select('role')

      const totalUsers = allUsers?.length || 0
      const totalCoaches = allUsers?.filter(u => u.role === 'coach').length || 0
      const totalStudents = allUsers?.filter(u => u.role === 'student').length || 0

      // Get task count
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')

      const totalTasks = tasks?.length || 0

      // Get announcement count
      const { data: announcements } = await supabase
        .from('announcements')
        .select('id')
        .eq('is_active', true)

      const totalAnnouncements = announcements?.length || 0

      setStats({
        totalUsers,
        totalCoaches,
        totalStudents,
        totalTasks,
        totalAnnouncements,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  const statCards = [
    {
      title: 'Toplam Kullanıcı',
      value: stats.totalUsers,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Koçlar',
      value: stats.totalCoaches,
      icon: <School sx={{ fontSize: 40 }} />,
      color: '#388e3c',
    },
    {
      title: 'Öğrenciler',
      value: stats.totalStudents,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#f57c00',
    },
    {
      title: 'Toplam Görev',
      value: stats.totalTasks,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: '#7b1fa2',
    },
    {
      title: 'Aktif Duyurular',
      value: stats.totalAnnouncements,
      icon: <Announcement sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
    },
  ]

  return (
    <AdminLayout currentPage="/admin">
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Hoş geldiniz, {currentUser?.full_name}! Sistemin genel durumunu burada görüntüleyebilirsiniz.
        </Typography>

        <Grid container spacing={3}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${card.color}22 0%, ${card.color}11 100%)`,
                  border: `1px solid ${card.color}33`,
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography variant="h3" component="div" sx={{ color: card.color, fontWeight: 'bold' }}>
                        {card.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {card.title}
                      </Typography>
                    </Box>
                    <Box sx={{ color: card.color, opacity: 0.8 }}>
                      {card.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Son Aktiviteler
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Son kullanıcı aktiviteleri ve sistem güncellemeleri burada görünecek.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Sistem Durumu
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sistem performansı ve sağlık durumu bilgileri burada görünecek.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  )
} 