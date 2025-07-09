'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material'
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid'
import { Add, Edit, Delete } from '@mui/icons-material'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, UserRole } from '@/types/database'
import { createUser, updateUser, deleteUser } from './actions'

interface UserFormData {
  id?: string
  email: string
  full_name: string
  role: UserRole
  password?: string
  assigned_coach_id?: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [coaches, setCoaches] = useState<UserProfile[]>([])
  const [coachAssignments, setCoachAssignments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    full_name: '',
    role: 'student',
    password: '',
    assigned_coach_id: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkAuthAndLoadUsers()
  }, [])

  const checkAuthAndLoadUsers = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/login')
      return
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      redirect('/login')
      return
    }

    await loadUsers()
  }

  const loadCoachAssignments = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('coach_student_assignments')
        .select(`
          student_id,
          coach_id,
          user_profiles!coach_student_assignments_coach_id_fkey (
            full_name
          )
        `)
        .eq('is_active', true)

      if (error) throw error

      const assignments: Record<string, string> = {}
      data?.forEach((assignment: any) => {
        assignments[assignment.student_id] = assignment.user_profiles?.full_name || ''
      })
      setCoachAssignments(assignments)
    } catch (error) {
      console.error('Error loading coach assignments:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])

      // Load coaches for assignment dropdown
      const coachUsers = (data || []).filter(user => user.role === 'coach')
      setCoaches(coachUsers)

      // Load coach assignments
      await loadCoachAssignments()
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      full_name: '',
      role: 'student',
      password: '',
      assigned_coach_id: '',
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const handleEditUser = async (user: UserProfile) => {
    setEditingUser(user)
    
    // If editing a student, get their current coach assignment
    let assignedCoachId = ''
    if (user.role === 'student') {
      try {
        const supabase = createClient()
        const { data: assignment } = await supabase
          .from('coach_student_assignments')
          .select('coach_id')
          .eq('student_id', user.id)
          .eq('is_active', true)
          .single()
        
        assignedCoachId = assignment?.coach_id || ''
      } catch (error) {
        console.log('No coach assignment found for student')
      }
    }
    
    setFormData({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      assigned_coach_id: assignedCoachId,
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const result = await deleteUser(userId)
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      await loadUsers()
    } catch (error: any) {
      alert('Kullanıcı silinirken hata oluştu: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      if (editingUser) {
        // Update existing user
        const result = await updateUser({
          id: editingUser.id,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          assigned_coach_id: formData.assigned_coach_id,
        })

        if (!result.success) {
          throw new Error(result.error)
        }
      } else {
        // Create new user
        if (!formData.password) {
          throw new Error('Yeni kullanıcı için şifre gerekli')
        }

        const result = await createUser({
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          password: formData.password,
          assigned_coach_id: formData.assigned_coach_id,
        })

        if (!result.success) {
          throw new Error(result.error)
        }
      }

      setDialogOpen(false)
      await loadUsers()
    } catch (error: any) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'full_name',
      headerName: 'Ad Soyad',
      width: 200,
      editable: false,
    },
    {
      field: 'email',
      headerName: 'E-posta',
      width: 250,
      editable: false,
    },
    {
      field: 'role',
      headerName: 'Rol',
      width: 130,
      renderCell: (params) => {
        const roleColors = {
          admin: 'error',
          coach: 'primary',
          student: 'success',
          coordinator: 'warning',
        } as const

        const roleLabels = {
          admin: 'Admin',
          coach: 'Koç',
          student: 'Öğrenci',
          coordinator: 'Koordinatör',
        }

        return (
          <Chip
            label={roleLabels[params.value as UserRole]}
            color={roleColors[params.value as UserRole]}
            size="small"
          />
        )
      },
    },
    {
      field: 'assigned_coach',
      headerName: 'Atanmış Koç',
      width: 180,
      renderCell: (params) => {
        if (params.row.role !== 'student') return '-'
        const coachName = coachAssignments[params.row.id]
        return coachName ? (
          <Chip label={coachName} variant="outlined" size="small" />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Atanmamış
          </Typography>
        )
      },
    },
    {
      field: 'created_at',
      headerName: 'Oluşturulma Tarihi',
      width: 160,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleString('tr-TR')
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'İşlemler',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="Düzenle"
          onClick={() => handleEditUser(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Sil"
          onClick={() => handleDeleteUser(params.row.id)}
        />,
      ],
    },
  ]

  if (loading) {
    return (
      <AdminLayout currentPage="/admin/users">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout currentPage="/admin/users">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Kullanıcı Yönetimi</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddUser}
          >
            Yeni Kullanıcı
          </Button>
        </Box>

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={users}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            checkboxSelection={false}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell:hover': {
                color: 'primary.main',
              },
            }}
          />
        </Box>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
            </DialogTitle>
            <DialogContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}
              
              <TextField
                fullWidth
                label="Ad Soyad"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
                required
              />
              
              {!editingUser && (
                <TextField
                  fullWidth
                  label="Şifre"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  margin="normal"
                  required
                />
              )}
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role}
                  label="Rol"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  <MenuItem value="student">Öğrenci</MenuItem>
                  <MenuItem value="coach">Koç</MenuItem>
                  <MenuItem value="coordinator">Koordinatör</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>

              {formData.role === 'student' && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Atanacak Koç</InputLabel>
                  <Select
                    value={formData.assigned_coach_id || ''}
                    label="Atanacak Koç"
                    onChange={(e) => setFormData({ ...formData, assigned_coach_id: e.target.value })}
                  >
                    <MenuItem value="">Koç atanmamış</MenuItem>
                    {coaches.map((coach) => (
                      <MenuItem key={coach.id} value={coach.id}>
                        {coach.full_name} ({coach.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>İptal</Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AdminLayout>
  )
} 