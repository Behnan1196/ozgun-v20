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
  Paper,
  Grid,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material'
import { 
  Add, 
  Edit, 
  Delete, 
  ExpandMore,
  Quiz,
} from '@mui/icons-material'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import { MockExam, Subject, DifficultyLevel } from '@/types/database'

interface MockExamFormData {
  id?: string
  name: string
  description: string
  subject_id: string
  difficulty_level: DifficultyLevel | null
  is_active: boolean
}

const difficultyLevels = [
  { value: 'baslangic', label: 'Başlangıç' },
  { value: 'orta', label: 'Orta' },
  { value: 'ileri', label: 'İleri' },
  { value: 'uzman', label: 'Uzman' },
] as const

export default function MockExamManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [mockExams, setMockExams] = useState<Record<string, MockExam[]>>({})
  const [unassignedMockExams, setUnassignedMockExams] = useState<MockExam[]>([])
  const [loading, setLoading] = useState(true)
  
  // Mock exam dialog states
  const [mockExamDialogOpen, setMockExamDialogOpen] = useState(false)
  const [editingMockExam, setEditingMockExam] = useState<MockExam | null>(null)
  const [mockExamFormData, setMockExamFormData] = useState<MockExamFormData>({
    name: '',
    description: '',
    subject_id: '',
    difficulty_level: null,
    is_active: true,
  })
  
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())

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

    await loadSubjectsAndMockExams()
  }

  const loadSubjectsAndMockExams = async () => {
    try {
      const supabase = createClient()
      
      // Load subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name')

      if (subjectsError) throw subjectsError
      setSubjects(subjectsData || [])

      // Load mock exams
      const { data: mockExamsData, error: mockExamsError } = await supabase
        .from('mock_exams')
        .select('*')
        .order('created_at', { ascending: false })

      if (mockExamsError) throw mockExamsError

      // Group mock exams by subject_id
      const mockExamsBySubject: Record<string, MockExam[]> = {}
      const unassigned: MockExam[] = []

      mockExamsData?.forEach((mockExam) => {
        if (mockExam.subject_id) {
          if (!mockExamsBySubject[mockExam.subject_id]) {
            mockExamsBySubject[mockExam.subject_id] = []
          }
          mockExamsBySubject[mockExam.subject_id].push(mockExam)
        } else {
          unassigned.push(mockExam)
        }
      })

      setMockExams(mockExamsBySubject)
      setUnassignedMockExams(unassigned)

    } catch (error) {
      console.error('Error loading subjects and mock exams:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock exam handlers
  const handleAddMockExam = (subjectId?: string) => {
    setEditingMockExam(null)
    setMockExamFormData({
      name: '',
      description: '',
      subject_id: subjectId || '',
      difficulty_level: null,
      is_active: true,
    })
    setFormError(null)
    setMockExamDialogOpen(true)
  }

  const handleEditMockExam = (mockExam: MockExam) => {
    setEditingMockExam(mockExam)
    setMockExamFormData({
      id: mockExam.id,
      name: mockExam.name,
      description: mockExam.description || '',
      subject_id: mockExam.subject_id || '',
      difficulty_level: mockExam.difficulty_level,
      is_active: mockExam.is_active,
    })
    setFormError(null)
    setMockExamDialogOpen(true)
  }

  const handleDeleteMockExam = async (mockExamId: string) => {
    if (!confirm('Bu deneme sınavını silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('mock_exams')
        .delete()
        .eq('id', mockExamId)

      if (error) throw error
      await loadSubjectsAndMockExams()
    } catch (error: any) {
      alert('Deneme sınavı silinirken hata oluştu: ' + error.message)
    }
  }

  const handleMockExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setFormError('Kullanıcı oturumu bulunamadı')
        return
      }

      const mockExamData = {
        name: mockExamFormData.name,
        description: mockExamFormData.description || null,
        subject_id: mockExamFormData.subject_id || null,
        difficulty_level: mockExamFormData.difficulty_level,
        is_active: mockExamFormData.is_active,
        created_by: user.id,
      }

      if (editingMockExam) {
        // Update existing mock exam
        const { error } = await supabase
          .from('mock_exams')
          .update(mockExamData)
          .eq('id', editingMockExam.id)

        if (error) throw error
      } else {
        // Create new mock exam
        const { error } = await supabase
          .from('mock_exams')
          .insert(mockExamData)

        if (error) throw error
      }

      setMockExamDialogOpen(false)
      await loadSubjectsAndMockExams()
    } catch (error: any) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSubjectExpansion = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects)
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId)
    } else {
      newExpanded.add(subjectId)
    }
    setExpandedSubjects(newExpanded)
  }

  const getDifficultyColor = (level: DifficultyLevel) => {
    switch (level) {
      case 'baslangic': return 'success'
      case 'orta': return 'warning'
      case 'ileri': return 'error'
      case 'uzman': return 'secondary'
      default: return 'default'
    }
  }

  const getDifficultyLabel = (level: DifficultyLevel) => {
    return difficultyLevels.find(d => d.value === level)?.label || level
  }

  if (loading) {
    return (
      <AdminLayout currentPage="/admin/mock-exams">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout currentPage="/admin/mock-exams">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Deneme Sınav Yönetimi</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleAddMockExam()}
          >
            Yeni Deneme Sınavı
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Subjects with their mock exams */}
          {subjects.map((subject) => (
            <Grid item xs={12} key={subject.id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                      onClick={() => toggleSubjectExpansion(subject.id)}
                      size="small"
                    >
                      <ExpandMore
                        sx={{
                          transform: expandedSubjects.has(subject.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s',
                        }}
                      />
                    </IconButton>
                    <Typography variant="h6">{subject.name}</Typography>
                    <Chip 
                      label={subject.is_active ? 'Aktif' : 'Pasif'} 
                      color={subject.is_active ? 'success' : 'default'}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {mockExams[subject.id]?.length || 0} deneme sınavı
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => handleAddMockExam(subject.id)}
                      sx={{ mr: 1 }}
                    >
                      Deneme Sınavı Ekle
                    </Button>
                  </Box>
                </Box>

                {subject.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {subject.description}
                  </Typography>
                )}

                {expandedSubjects.has(subject.id) && (
                  <Box sx={{ mt: 2, pl: 4 }}>
                    {mockExams[subject.id]?.length > 0 ? (
                      mockExams[subject.id].map((mockExam) => (
                        <Paper key={mockExam.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Quiz fontSize="small" />
                              <Typography variant="subtitle1">{mockExam.name}</Typography>
                              <Chip 
                                label={mockExam.is_active ? 'Aktif' : 'Pasif'} 
                                color={mockExam.is_active ? 'success' : 'default'}
                                size="small"
                              />
                              {mockExam.difficulty_level && (
                                <Chip 
                                  label={getDifficultyLabel(mockExam.difficulty_level)} 
                                  color={getDifficultyColor(mockExam.difficulty_level)}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            <Box>
                              <IconButton onClick={() => handleEditMockExam(mockExam)} size="small">
                                <Edit />
                              </IconButton>
                              <IconButton onClick={() => handleDeleteMockExam(mockExam.id)} size="small" color="error">
                                <Delete />
                              </IconButton>
                            </Box>
                          </Box>
                          {mockExam.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 3 }}>
                              {mockExam.description}
                            </Typography>
                          )}
                        </Paper>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Bu derste henüz deneme sınavı bulunmuyor.
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}

          {/* Unassigned Mock Exams */}
          {unassignedMockExams.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">Derse Atanmamış Deneme Sınavları</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {unassignedMockExams.length} deneme sınavı
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => handleAddMockExam()}
                      sx={{ mr: 1 }}
                    >
                      Deneme Sınavı Ekle
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ mt: 2 }}>
                  {unassignedMockExams.map((mockExam) => (
                    <Paper key={mockExam.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Quiz fontSize="small" />
                          <Typography variant="subtitle1">{mockExam.name}</Typography>
                          <Chip 
                            label={mockExam.is_active ? 'Aktif' : 'Pasif'} 
                            color={mockExam.is_active ? 'success' : 'default'}
                            size="small"
                          />
                          {mockExam.difficulty_level && (
                            <Chip 
                              label={getDifficultyLabel(mockExam.difficulty_level)} 
                              color={getDifficultyColor(mockExam.difficulty_level)}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Box>
                          <IconButton onClick={() => handleEditMockExam(mockExam)} size="small">
                            <Edit />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteMockExam(mockExam.id)} size="small" color="error">
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                      {mockExam.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 3 }}>
                          {mockExam.description}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Mock Exam Dialog */}
        <Dialog open={mockExamDialogOpen} onClose={() => setMockExamDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleMockExamSubmit}>
            <DialogTitle>
              {editingMockExam ? 'Deneme Sınavı Düzenle' : 'Yeni Deneme Sınavı Ekle'}
            </DialogTitle>
            <DialogContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}
              
              <TextField
                fullWidth
                label="Deneme Sınavı Adı"
                value={mockExamFormData.name}
                onChange={(e) => setMockExamFormData({ ...mockExamFormData, name: e.target.value })}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Açıklama"
                value={mockExamFormData.description}
                onChange={(e) => setMockExamFormData({ ...mockExamFormData, description: e.target.value })}
                multiline
                rows={3}
                margin="normal"
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Ders (Opsiyonel)</InputLabel>
                <Select
                  value={mockExamFormData.subject_id}
                  label="Ders (Opsiyonel)"
                  onChange={(e) => setMockExamFormData({ ...mockExamFormData, subject_id: e.target.value })}
                >
                  <MenuItem value="">Ders seçilmemiş</MenuItem>
                  {subjects.filter(s => s.is_active).map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Zorluk Seviyesi (Opsiyonel)</InputLabel>
                <Select
                  value={mockExamFormData.difficulty_level || ''}
                  label="Zorluk Seviyesi (Opsiyonel)"
                  onChange={(e) => setMockExamFormData({ 
                    ...mockExamFormData, 
                    difficulty_level: e.target.value ? e.target.value as DifficultyLevel : null 
                  })}
                >
                  <MenuItem value="">Zorluk seviyesi seçilmemiş</MenuItem>
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
                    checked={mockExamFormData.is_active}
                    onChange={(e) => setMockExamFormData({ ...mockExamFormData, is_active: e.target.checked })}
                  />
                }
                label="Aktif"
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setMockExamDialogOpen(false)}>İptal</Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : (editingMockExam ? 'Güncelle' : 'Ekle')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AdminLayout>
  )
} 