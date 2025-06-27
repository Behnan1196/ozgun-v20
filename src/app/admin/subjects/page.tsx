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
} from '@mui/icons-material'
import AdminLayout from '@/components/admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'

interface Subject {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

interface Topic {
  id: string
  subject_id: string
  name: string
  description: string | null
  order_index: number
  is_active: boolean
  created_at: string
}

interface SubjectFormData {
  id?: string
  name: string
  description: string
  is_active: boolean
}

interface TopicFormData {
  id?: string
  subject_id: string
  name: string
  description: string
  order_index: number
  is_active: boolean
}

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Record<string, Topic[]>>({})
  const [loading, setLoading] = useState(true)
  
  // Subject dialog states
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [subjectFormData, setSubjectFormData] = useState<SubjectFormData>({
    name: '',
    description: '',
    is_active: true,
  })
  
  // Topic dialog states
  const [topicDialogOpen, setTopicDialogOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [topicFormData, setTopicFormData] = useState<TopicFormData>({
    subject_id: '',
    name: '',
    description: '',
    order_index: 0,
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

    await loadSubjectsAndTopics()
  }

  const loadSubjectsAndTopics = async () => {
    try {
      const supabase = createClient()
      
      // Load subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name')

      if (subjectsError) throw subjectsError
      setSubjects(subjectsData || [])

      // Load topics grouped by subject
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select('*')
        .order('order_index')

      if (topicsError) throw topicsError

      // Group topics by subject_id
      const topicsBySubject: Record<string, Topic[]> = {}
      topicsData?.forEach((topic) => {
        if (!topicsBySubject[topic.subject_id]) {
          topicsBySubject[topic.subject_id] = []
        }
        topicsBySubject[topic.subject_id].push(topic)
      })
      setTopics(topicsBySubject)

    } catch (error) {
      console.error('Error loading subjects and topics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Subject handlers
  const handleAddSubject = () => {
    setEditingSubject(null)
    setSubjectFormData({
      name: '',
      description: '',
      is_active: true,
    })
    setFormError(null)
    setSubjectDialogOpen(true)
  }

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject)
    setSubjectFormData({
      id: subject.id,
      name: subject.name,
      description: subject.description || '',
      is_active: subject.is_active,
    })
    setFormError(null)
    setSubjectDialogOpen(true)
  }

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Bu dersi ve tüm konularını silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)

      if (error) throw error
      await loadSubjectsAndTopics()
    } catch (error: any) {
      alert('Ders silinirken hata oluştu: ' + error.message)
    }
  }

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      const supabase = createClient()

      if (editingSubject) {
        // Update existing subject
        const { error } = await supabase
          .from('subjects')
          .update({
            name: subjectFormData.name,
            description: subjectFormData.description || null,
            is_active: subjectFormData.is_active,
          })
          .eq('id', editingSubject.id)

        if (error) throw error
      } else {
        // Create new subject
        const { error } = await supabase
          .from('subjects')
          .insert({
            name: subjectFormData.name,
            description: subjectFormData.description || null,
            is_active: subjectFormData.is_active,
          })

        if (error) throw error
      }

      setSubjectDialogOpen(false)
      await loadSubjectsAndTopics()
    } catch (error: any) {
      setFormError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Topic handlers
  const handleAddTopic = (subjectId: string) => {
    const subjectTopics = topics[subjectId] || []
    const nextOrderIndex = Math.max(...subjectTopics.map(t => t.order_index), 0) + 1

    setEditingTopic(null)
    setTopicFormData({
      subject_id: subjectId,
      name: '',
      description: '',
      order_index: nextOrderIndex,
      is_active: true,
    })
    setFormError(null)
    setTopicDialogOpen(true)
  }

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic)
    setTopicFormData({
      id: topic.id,
      subject_id: topic.subject_id,
      name: topic.name,
      description: topic.description || '',
      order_index: topic.order_index,
      is_active: topic.is_active,
    })
    setFormError(null)
    setTopicDialogOpen(true)
  }

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Bu konuyu silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', topicId)

      if (error) throw error
      await loadSubjectsAndTopics()
    } catch (error: any) {
      alert('Konu silinirken hata oluştu: ' + error.message)
    }
  }

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      const supabase = createClient()

      if (editingTopic) {
        // Update existing topic
        const { error } = await supabase
          .from('topics')
          .update({
            name: topicFormData.name,
            description: topicFormData.description || null,
            order_index: topicFormData.order_index,
            is_active: topicFormData.is_active,
          })
          .eq('id', editingTopic.id)

        if (error) throw error
      } else {
        // Create new topic
        const { error } = await supabase
          .from('topics')
          .insert({
            subject_id: topicFormData.subject_id,
            name: topicFormData.name,
            description: topicFormData.description || null,
            order_index: topicFormData.order_index,
            is_active: topicFormData.is_active,
          })

        if (error) throw error
      }

      setTopicDialogOpen(false)
      await loadSubjectsAndTopics()
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

  if (loading) {
    return (
      <AdminLayout currentPage="/admin/subjects">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout currentPage="/admin/subjects">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Ders ve Konu Yönetimi</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddSubject}
          >
            Yeni Ders
          </Button>
        </Box>

        <Grid container spacing={3}>
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
                      {topics[subject.id]?.length || 0} konu
                    </Typography>
                  </Box>
                  <Box>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => handleAddTopic(subject.id)}
                      sx={{ mr: 1 }}
                    >
                      Konu Ekle
                    </Button>
                    <IconButton onClick={() => handleEditSubject(subject)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteSubject(subject.id)} size="small" color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                {subject.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {subject.description}
                  </Typography>
                )}

                {expandedSubjects.has(subject.id) && (
                  <Box sx={{ mt: 2, pl: 4 }}>
                    {topics[subject.id]?.length > 0 ? (
                      topics[subject.id].map((topic) => (
                        <Paper key={topic.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Chip label={topic.order_index} size="small" variant="outlined" />
                              <Typography variant="subtitle1">{topic.name}</Typography>
                              <Chip 
                                label={topic.is_active ? 'Aktif' : 'Pasif'} 
                                color={topic.is_active ? 'success' : 'default'}
                                size="small"
                              />
                            </Box>
                            <Box>
                              <IconButton onClick={() => handleEditTopic(topic)} size="small">
                                <Edit />
                              </IconButton>
                              <IconButton onClick={() => handleDeleteTopic(topic.id)} size="small" color="error">
                                <Delete />
                              </IconButton>
                            </Box>
                          </Box>
                          {topic.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 5 }}>
                              {topic.description}
                            </Typography>
                          )}
                        </Paper>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Bu derste henüz konu bulunmuyor.
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Subject Dialog */}
        <Dialog open={subjectDialogOpen} onClose={() => setSubjectDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSubjectSubmit}>
            <DialogTitle>
              {editingSubject ? 'Ders Düzenle' : 'Yeni Ders Ekle'}
            </DialogTitle>
            <DialogContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}
              
              <TextField
                fullWidth
                label="Ders Adı"
                value={subjectFormData.name}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Açıklama"
                value={subjectFormData.description}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, description: e.target.value })}
                multiline
                rows={3}
                margin="normal"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={subjectFormData.is_active}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, is_active: e.target.checked })}
                  />
                }
                label="Aktif"
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSubjectDialogOpen(false)}>İptal</Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : (editingSubject ? 'Güncelle' : 'Ekle')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Topic Dialog */}
        <Dialog open={topicDialogOpen} onClose={() => setTopicDialogOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleTopicSubmit}>
            <DialogTitle>
              {editingTopic ? 'Konu Düzenle' : 'Yeni Konu Ekle'}
            </DialogTitle>
            <DialogContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}
              
              <TextField
                fullWidth
                label="Konu Adı"
                value={topicFormData.name}
                onChange={(e) => setTopicFormData({ ...topicFormData, name: e.target.value })}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Açıklama"
                value={topicFormData.description}
                onChange={(e) => setTopicFormData({ ...topicFormData, description: e.target.value })}
                multiline
                rows={3}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Sıra Numarası"
                type="number"
                value={topicFormData.order_index}
                onChange={(e) => setTopicFormData({ ...topicFormData, order_index: parseInt(e.target.value) || 0 })}
                margin="normal"
                required
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={topicFormData.is_active}
                    onChange={(e) => setTopicFormData({ ...topicFormData, is_active: e.target.checked })}
                  />
                }
                label="Aktif"
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setTopicDialogOpen(false)}>İptal</Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? 'Kaydediliyor...' : (editingTopic ? 'Güncelle' : 'Ekle')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </AdminLayout>
  )
} 