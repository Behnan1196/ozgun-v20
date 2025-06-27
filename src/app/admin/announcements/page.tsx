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
  Alert,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Divider,
  Grid,
} from '@mui/material'
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid'
import { Add, Edit, Delete, Visibility, VisibilityOff, Announcement } from '@mui/icons-material'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

interface AnnouncementData {
  id: string
  title: string
  content: string
  created_by: string
  is_active: boolean
  created_at: string
  user_profiles?: {
    full_name: string
  }
}

interface AnnouncementFormData {
  id?: string
  title: string
  content: string
  is_active: boolean
}

export default function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementData | null>(null)
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    is_active: true,
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
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

    await loadAnnouncements()
  }

  const loadAnnouncements = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          user_profiles (
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error loading announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAnnouncement = () => {
    setEditingAnnouncement(null)
    setFormData({
      title: '',
      content: '',
      is_active: true,
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const handleEditAnnouncement = (announcement: AnnouncementData) => {
    setEditingAnnouncement(announcement)
    setFormData({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      is_active: announcement.is_active,
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId)

      if (error) throw error
      await loadAnnouncements()
    } catch (error: any) {
      alert('Duyuru silinirken hata oluştu: ' + error.message)
    }
  }

  const handleToggleActive = async (announcementId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', announcementId)

      if (error) throw error
      await loadAnnouncements()
    } catch (error: any) {
      alert('Duyuru durumu güncellenirken hata oluştu: ' + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı')

      const announcementData = {
        title: formData.title,
        content: formData.content,
        is_active: formData.is_active,
      }

      if (editingAnnouncement) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingAnnouncement.id)

        if (error) throw error
      } else {
        // Create new announcement
        const { error } = await supabase
          .from('announcements')
          .insert({
            ...announcementData,
            created_by: user.id,
          })

        if (error) throw error
      }

      setDialogOpen(false)
      await loadAnnouncements()
    } catch (error: any) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Başlık',
      width: 300,
      editable: false,
    },
    {
      field: 'content',
      headerName: 'İçerik',
      width: 400,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'created_by_name',
      headerName: 'Oluşturan',
      width: 150,
      valueGetter: (params) => params.row.user_profiles?.full_name || 'Bilinmiyor',
    },
    {
      field: 'is_active',
      headerName: 'Durum',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Aktif' : 'Pasif'} 
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Oluşturulma',
      width: 150,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString('tr-TR')
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'İşlemler',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="Düzenle"
          onClick={() => handleEditAnnouncement(params.row)}
        />,
        <GridActionsCellItem
          key="toggle"
          icon={params.row.is_active ? <VisibilityOff /> : <Visibility />}
          label={params.row.is_active ? 'Pasifleştir' : 'Aktifleştir'}
          onClick={() => handleToggleActive(params.row.id, params.row.is_active)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Sil"
          onClick={() => handleDeleteAnnouncement(params.row.id)}
        />,
      ],
    },
  ]

  const renderCardView = () => (
    <Grid container spacing={3}>
      {announcements.map((announcement) => (
        <Grid item xs={12} md={6} lg={4} key={announcement.id}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Announcement color="primary" />
                <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                  {announcement.title}
                </Typography>
                <Chip 
                  label={announcement.is_active ? 'Aktif' : 'Pasif'} 
                  color={announcement.is_active ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
              }}>
                {announcement.content}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {announcement.user_profiles?.full_name || 'Bilinmiyor'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(announcement.created_at).toLocaleDateString('tr-TR')}
                </Typography>
              </Box>
            </CardContent>
            
            <CardActions>
              <Button size="small" onClick={() => handleEditAnnouncement(announcement)}>
                Düzenle
              </Button>
              <Button 
                size="small" 
                onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
              >
                {announcement.is_active ? 'Pasifleştir' : 'Aktifleştir'}
              </Button>
              <Button 
                size="small" 
                color="error"
                onClick={() => handleDeleteAnnouncement(announcement.id)}
              >
                Sil
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  )

  if (loading) {
    return (
      <AdminLayout currentPage="/admin/announcements">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout currentPage="/admin/announcements">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Duyuru Yönetimi</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('cards')}
              size="small"
            >
              Kart Görünümü
            </Button>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('table')}
              size="small"
            >
              Tablo Görünümü
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddAnnouncement}
            >
              Yeni Duyuru
            </Button>
          </Box>
        </Box>

        {viewMode === 'cards' ? renderCardView() : (
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={announcements}
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
        )}

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingAnnouncement ? 'Duyuru Düzenle' : 'Yeni Duyuru Ekle'}
            </DialogTitle>
            <DialogContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}
              
              <TextField
                fullWidth
                label="Başlık"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="İçerik"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                multiline
                rows={6}
                margin="normal"
                required
                placeholder="Duyuru içeriğini buraya yazın..."
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Aktif olarak yayınla"
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>İptal</Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : (editingAnnouncement ? 'Güncelle' : 'Yayınla')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AdminLayout>
  )
} 