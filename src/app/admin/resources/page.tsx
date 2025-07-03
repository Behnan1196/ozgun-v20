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
  Switch,
  FormControlLabel,
} from '@mui/material'
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid'
import { Add, Edit, Delete, OpenInNew, VideoLibrary, Description, PictureAsPdf, Apps } from '@mui/icons-material'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

interface Resource {
  id: string
  name: string
  description: string | null
  url: string
  category: 'video' | 'document' | 'pdf' | 'application'
  subject_id: string | null
  created_by: string
  is_active: boolean
  created_at: string
  difficulty_level: 'baslangic' | 'orta' | 'ileri' | 'uzman' | null
  subjects?: {
    name: string
  }
}

interface Subject {
  id: string
  name: string
  is_active: boolean
}

interface ResourceFormData {
  id?: string
  name: string
  description: string
  url: string
  category: 'video' | 'document' | 'pdf' | 'application'
  subject_id: string
  is_active: boolean
  difficulty_level: 'baslangic' | 'orta' | 'ileri' | 'uzman' | null
}

const resourceCategories = [
  { value: 'video', label: 'Video', icon: VideoLibrary },
  { value: 'document', label: 'Doküman', icon: Description },
  { value: 'pdf', label: 'PDF', icon: PictureAsPdf },
  { value: 'application', label: 'Uygulama', icon: Apps },
] as const

const difficultyLevels = [
  { value: 'baslangic', label: 'Başlangıç' },
  { value: 'orta', label: 'Orta' },
  { value: 'ileri', label: 'İleri' },
  { value: 'uzman', label: 'Uzman' },
] as const

export default function ResourceManagement() {
  const [resources, setResources] = useState<Resource[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [formData, setFormData] = useState<ResourceFormData>({
    name: '',
    description: '',
    url: '',
    category: 'document',
    subject_id: '',
    is_active: true,
    difficulty_level: null,
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

    await Promise.all([loadResources(), loadSubjects()])
  }

  const loadResources = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          subjects (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setResources(data || [])
    } catch (error) {
      console.error('Error loading resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
  }

  const handleAddResource = () => {
    setEditingResource(null)
    setFormData({
      name: '',
      description: '',
      url: '',
      category: 'document',
      subject_id: '',
      is_active: true,
      difficulty_level: null,
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource)
    setFormData({
      id: resource.id,
      name: resource.name,
      description: resource.description || '',
      url: resource.url,
      category: resource.category,
      subject_id: resource.subject_id || '',
      is_active: resource.is_active,
      difficulty_level: resource.difficulty_level,
    })
    setFormError(null)
    setDialogOpen(true)
  }

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Bu kaynağı silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId)

      if (error) throw error
      await loadResources()
    } catch (error: any) {
      alert('Kaynak silinirken hata oluştu: ' + error.message)
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

      const resourceData = {
        name: formData.name,
        description: formData.description || null,
        url: formData.url,
        category: formData.category,
        subject_id: formData.subject_id || null,
        is_active: formData.is_active,
        difficulty_level: formData.difficulty_level,
      }

      if (editingResource) {
        // Update existing resource
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', editingResource.id)

        if (error) throw error
      } else {
        // Create new resource
        const { error } = await supabase
          .from('resources')
          .insert({
            ...resourceData,
            created_by: user.id,
          })

        if (error) throw error
      }

      setDialogOpen(false)
      await loadResources()
    } catch (error: any) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    const categoryConfig = resourceCategories.find(c => c.value === category)
    const IconComponent = categoryConfig?.icon || Description
    return <IconComponent />
  }

  const getCategoryLabel = (category: string) => {
    return resourceCategories.find(c => c.value === category)?.label || category
  }

  const columns: GridColDef[] = [
    {
      field: 'category',
      headerName: 'Tür',
      width: 80,
      renderCell: (params) => getCategoryIcon(params.value),
    },
    {
      field: 'name',
      headerName: 'Kaynak Adı',
      width: 250,
      editable: false,
    },
    {
      field: 'category_label',
      headerName: 'Kategori',
      width: 120,
      valueGetter: (params) => getCategoryLabel(params.row.category),
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'subject_name',
      headerName: 'Ders',
      width: 150,
      valueGetter: (params) => params.row.subjects?.name || '-',
      renderCell: (params) => {
        const subjectName = params.row.subjects?.name
        return subjectName ? (
          <Chip label={subjectName} size="small" color="primary" variant="outlined" />
        ) : (
          <Typography variant="body2" color="text.secondary">-</Typography>
        )
      },
    },
    {
      field: 'url',
      headerName: 'Bağlantı',
      width: 200,
      renderCell: (params) => (
        <Button
          size="small"
          startIcon={<OpenInNew />}
          onClick={() => window.open(params.value, '_blank')}
          sx={{ textTransform: 'none' }}
        >
          Aç
        </Button>
      ),
    },
    {
      field: 'difficulty_level',
      headerName: 'Zorluk',
      width: 120,
      renderCell: (params) => {
        const level = params.value
        if (!level) return <Typography variant="body2" color="text.secondary">-</Typography>
        
        const colors: Record<string, string> = {
          baslangic: 'success',
          orta: 'info',
          ileri: 'warning',
          uzman: 'error',
        }
        
        const labels: Record<string, string> = {
          baslangic: 'Başlangıç',
          orta: 'Orta',
          ileri: 'İleri',
          uzman: 'Uzman',
        }
        
        return (
          <Chip 
            label={labels[level]} 
            color={colors[level] as any}
            size="small"
            variant="outlined"
          />
        )
      },
    },
    {
      field: 'is_active',
      headerName: 'Durum',
      width: 100,
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
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="Düzenle"
          onClick={() => handleEditResource(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Delete />}
          label="Sil"
          onClick={() => handleDeleteResource(params.row.id)}
        />,
      ],
    },
  ]

  if (loading) {
    return (
      <AdminLayout currentPage="/admin/resources">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout currentPage="/admin/resources">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Kaynak Yönetimi</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddResource}
          >
            Yeni Kaynak
          </Button>
        </Box>

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={resources}
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
              {editingResource ? 'Kaynak Düzenle' : 'Yeni Kaynak Ekle'}
            </DialogTitle>
            <DialogContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}
              
              <TextField
                fullWidth
                label="Kaynak Adı"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Açıklama"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="URL / Bağlantı"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                margin="normal"
                required
                placeholder="https://..."
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={formData.category}
                  label="Kategori"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                >
                  {resourceCategories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <category.icon fontSize="small" />
                        {category.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Ders (Opsiyonel)</InputLabel>
                <Select
                  value={formData.subject_id}
                  label="Ders (Opsiyonel)"
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                >
                  <MenuItem value="">Ders seçilmemiş</MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Zorluk Derecesi</InputLabel>
                <Select
                  value={formData.difficulty_level || ''}
                  label="Zorluk Derecesi"
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as any })}
                >
                  <MenuItem value="">Belirtilmemiş</MenuItem>
                  {difficultyLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Aktif"
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>İptal</Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : (editingResource ? 'Güncelle' : 'Ekle')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AdminLayout>
  )
} 