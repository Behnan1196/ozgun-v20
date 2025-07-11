'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { redirect, useRouter } from 'next/navigation'
import { 
  Users, 
  ClipboardList, 
  MessageCircle, 
  Video, 
  BarChart3,
  BookOpen,
  Calendar,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  GraduationCap,
  LogOut,
  Plus,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Edit,
  Edit2,
  Trash2,
  ChevronDown,
  Timer,
  Calculator,
  FileText,
  ExternalLink,
  Award,
  Link,
  Trophy,
  Settings,
  Mail,
  Upload,
  Eye,
  EyeOff,
  Palette,
  Camera,
  UserCircle,
  Shield,
  Globe,
  Smartphone,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'
import { ProfileAvatar } from '@/components/ui/avatar'
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable'
import StreamChat from '@/components/StreamChat'
import StreamVideo from '@/components/StreamVideo'
import PomodoroTimer from '@/components/PomodoroTimer'
import { MockExam } from '@/types/database'

// Interfaces
interface Student {
  id: string
  full_name: string
  email: string
  phone?: string
  department?: string
  school?: string
  tutoring_center?: string
  target_university?: string
  target_department?: string
  yks_score?: number
  start_date?: string
  parent_name?: string
  parent_phone?: string
  address?: string
  notes?: string
  created_at: string
}

interface CoachAssignment {
  id: string
  assigned_at: string
  student: Student
}

interface Task {
  id: string
  title: string
  description?: string
  subject_id?: string
  topic_id?: string
  resource_id?: string
  mock_exam_id?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date?: string
  scheduled_date: string
  scheduled_start_time?: string
  scheduled_end_time?: string
  estimated_duration: number
  problem_count?: number
  priority: 'low' | 'medium' | 'high'
  task_type: 'study' | 'practice' | 'exam' | 'review' | 'resource' | 'coaching_session'
  assigned_to: string
  assigned_by: string
  created_at: string
  updated_at: string
  completed_at?: string
}

interface Subject {
  id: string
  name: string
  description?: string
  is_active: boolean
}

interface Topic {
  id: string
  subject_id: string
  name: string
  description?: string
  order_index: number
  is_active: boolean
}

interface Resource {
  id: string
  name: string
  description?: string
  url: string
  category: 'video' | 'document' | 'pdf' | 'application'
  subject_id?: string
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Goal {
  id: string
  student_id: string
  coach_id: string
  goal_type: 'tyt_target' | 'ayt_target' | 'university_target' | 'department_target' | 'study_hours' | 'custom'
  title: string
  description?: string
  target_value?: string
  current_value?: string
  target_date?: string
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ExamForm {
  exam_type: 'TYT' | 'AYT' | 'Tarama'
  exam_date: string
  exam_name: string
  exam_duration: number
  
  // TYT Scores - Türkçe
  tyt_turkce_correct: number
  tyt_turkce_wrong: number
  
  // TYT Scores - Matematik
  tyt_matematik_correct: number
  tyt_matematik_wrong: number
  tyt_geometri_correct: number
  tyt_geometri_wrong: number
  
  // TYT Scores - Sosyal Bilimler
  tyt_tarih_correct: number
  tyt_tarih_wrong: number
  tyt_cografya_correct: number
  tyt_cografya_wrong: number
  tyt_felsefe_correct: number
  tyt_felsefe_wrong: number
  tyt_din_correct: number
  tyt_din_wrong: number
  
  // TYT Scores - Fen Bilimleri
  tyt_fizik_correct: number
  tyt_fizik_wrong: number
  tyt_kimya_correct: number
  tyt_kimya_wrong: number
  tyt_biyoloji_correct: number
  tyt_biyoloji_wrong: number
  
  // AYT Scores
  ayt_matematik_correct: number
  ayt_matematik_wrong: number
  ayt_geometri_correct: number
  ayt_geometri_wrong: number
  
  // Tarama Scores
  tarama_lessons: Array<{
    subject: string
    question_count: number
    correct: number
    wrong: number
  }>
  
  notes: string
}

interface MockExamResult {
  id: string
  student_id: string
  coach_id: string
  exam_type: 'TYT' | 'AYT' | 'Tarama'
  exam_date: string
  exam_name: string
  exam_duration?: number
  
  // TYT Scores - Türkçe
  tyt_turkce_correct?: number
  tyt_turkce_wrong?: number
  tyt_turkce_net?: number

  // TYT Scores - Matematik
  tyt_matematik_correct?: number
  tyt_matematik_wrong?: number
  tyt_matematik_net?: number
  tyt_geometri_correct?: number
  tyt_geometri_wrong?: number
  tyt_geometri_net?: number

  // TYT Scores - Sosyal Bilimler
  tyt_tarih_correct?: number
  tyt_tarih_wrong?: number
  tyt_tarih_net?: number
  tyt_cografya_correct?: number
  tyt_cografya_wrong?: number
  tyt_cografya_net?: number
  tyt_felsefe_correct?: number
  tyt_felsefe_wrong?: number
  tyt_felsefe_net?: number
  tyt_din_correct?: number
  tyt_din_wrong?: number
  tyt_din_net?: number

  // TYT Scores - Fen Bilimleri
  tyt_fizik_correct?: number
  tyt_fizik_wrong?: number
  tyt_fizik_net?: number
  tyt_kimya_correct?: number
  tyt_kimya_wrong?: number
  tyt_kimya_net?: number
  tyt_biyoloji_correct?: number
  tyt_biyoloji_wrong?: number
  tyt_biyoloji_net?: number

  // TYT Group Totals
  tyt_total_net?: number
  tyt_matematik_total_net?: number
  tyt_sosyal_total_net?: number
  tyt_fen_total_net?: number
  
  // AYT Scores
  ayt_matematik_correct?: number
  ayt_matematik_wrong?: number
  ayt_matematik_net?: number
  ayt_geometri_correct?: number
  ayt_geometri_wrong?: number
  ayt_geometri_net?: number
  ayt_total_net?: number
  
  // Tarama Scores
  tarama_lessons?: Array<{
    subject: string
    question_count: number
    correct: number
    wrong: number
    net: number
  }>
  tarama_total_net?: number
  
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface EducationalLink {
  id: string
  title: string
  description?: string
  url: string
  category: string
  icon_letter?: string
  icon_color: string
  display_order: number
  is_active: boolean
  target_audience: string
  created_at: string
  updated_at: string
}

export default function CoachPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [myStudents, setMyStudents] = useState<CoachAssignment[]>([])
  const [assignedCoach, setAssignedCoach] = useState<any>(null) // For student role
  const [userRole, setUserRole] = useState<'coach' | 'student' | 'coordinator' | null>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [activeTab, setActiveTab] = useState('statistics')
  const [weeklyTasks, setWeeklyTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [mockExams, setMockExams] = useState<MockExam[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [mockExamResults, setMockExamResults] = useState<MockExamResult[]>([])
  const [educationalLinks, setEducationalLinks] = useState<EducationalLink[]>([])
  const [loading, setLoading] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskModalDate, setTaskModalDate] = useState<Date | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    topic_id: '',
    resource_id: '',
    mock_exam_id: '',
    task_type: 'study' as 'study' | 'practice' | 'exam' | 'review' | 'resource' | 'coaching_session',
    scheduled_start_time: '',
    scheduled_end_time: '',
    estimated_duration: 60,
    problem_count: 10
  })

  // Goal management states
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  
  // Exam management states
  const [showExamModal, setShowExamModal] = useState(false)
  const [editingExam, setEditingExam] = useState<MockExamResult | null>(null)
  const [examModalTab, setExamModalTab] = useState<'TYT' | 'AYT' | 'Tarama'>('TYT')
  const [goalForm, setGoalForm] = useState({
    goal_type: 'custom' as 'tyt_target' | 'ayt_target' | 'university_target' | 'department_target' | 'study_hours' | 'custom',
    title: '',
    description: '',
    target_value: '',
    current_value: '',
    target_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'active' as 'active' | 'completed' | 'paused' | 'cancelled'
  })

  const [examForm, setExamForm] = useState<ExamForm>({
    exam_type: 'TYT',
    exam_date: '',
    exam_name: '',
    exam_duration: 180,
    
    // TYT Scores - Türkçe
    tyt_turkce_correct: 0,
    tyt_turkce_wrong: 0,
    
    // TYT Scores - Matematik
    tyt_matematik_correct: 0,
    tyt_matematik_wrong: 0,
    tyt_geometri_correct: 0,
    tyt_geometri_wrong: 0,
    
    // TYT Scores - Sosyal Bilimler
    tyt_tarih_correct: 0,
    tyt_tarih_wrong: 0,
    tyt_cografya_correct: 0,
    tyt_cografya_wrong: 0,
    tyt_felsefe_correct: 0,
    tyt_felsefe_wrong: 0,
    tyt_din_correct: 0,
    tyt_din_wrong: 0,
    
    // TYT Scores - Fen Bilimleri
    tyt_fizik_correct: 0,
    tyt_fizik_wrong: 0,
    tyt_kimya_correct: 0,
    tyt_kimya_wrong: 0,
    tyt_biyoloji_correct: 0,
    tyt_biyoloji_wrong: 0,
    
    // AYT Scores
    ayt_matematik_correct: 0,
    ayt_matematik_wrong: 0,
    ayt_geometri_correct: 0,
    ayt_geometri_wrong: 0,
    
    // Tarama Scores
    tarama_lessons: [],
    
    notes: ''
  })


  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    school: '',
    tutoring_center: '',
    target_university: '',
    target_department: '',
    yks_score: '',
    start_date: '',
    parent_name: '',
    parent_phone: '',
    address: '',
    notes: ''
  })

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
    avatar_url: '' as string | null,
    theme: 'system', // light, dark, system
    language: 'tr',
    notifications_enabled: true,
    email_notifications: true,
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const [showStatsMonthly, setShowStatsMonthly] = useState(false)
  
  // Calendar responsive state
  const [calendarContainerWidth, setCalendarContainerWidth] = useState<number>(0)
  const calendarContainerRef = useRef<HTMLDivElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // Logout function
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
      // Fallback to direct navigation if router fails
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
    setUserMenuOpen(false) // Close user dropdown
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
        setSettingsForm(prev => ({ ...prev, avatar_url: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    setSettingsForm(prev => ({ ...prev, avatar_url: null }))
  }

  const updateProfile = async () => {
    try {
      // If we're removing an existing avatar, delete it from storage
      if (profile?.avatar_url && !settingsForm.avatar_url) {
        try {
          // Extract the file path from the URL
          const url = new URL(profile.avatar_url)
          const pathParts = url.pathname.split('/')
          const avatarPath = pathParts[pathParts.length - 1]

          if (avatarPath) {
            const { error: storageError } = await supabase.storage
              .from('avatars')
              .remove([avatarPath])
            if (storageError) {
              console.error('Error removing old avatar:', storageError)
            }
          }
        } catch (error) {
          console.error('Error parsing avatar URL:', error)
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  // Load user and profile
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Accept coach, student, and coordinator roles
      if (!profile || (profile.role !== 'coach' && profile.role !== 'student' && profile.role !== 'coordinator')) {
        window.location.href = '/dashboard'
        return
      }

      setUser(user)
      setProfile(profile)
      setUserRole(profile.role)

      // If student, load assigned coach instead of students
      if (profile.role === 'student') {
        const { data: assignment } = await supabase
          .from('coach_student_assignments')
          .select(`
            coach_id,
            coach:coach_id(id, full_name, email)
          `)
          .eq('student_id', user.id)
          .eq('is_active', true)
          .single()

        if (assignment?.coach) {
          setAssignedCoach(assignment.coach)
          // For students, auto-select themselves as the "student"
          setSelectedStudent({
            id: user.id,
            full_name: profile.full_name || '',
            email: user.email || '',
            created_at: profile.created_at || ''
          })
        }
      }
    }

    loadUser()
  }, [])

  // Load coach's students (only for coach role) or all students (for coordinator role)
  useEffect(() => {
    const loadStudents = async () => {
      if (!user) return
      
      // For students, just set loading to false since they don't need to load student list
      if (userRole === 'student') {
        setLoading(false)
        return
      }
      
      if (userRole !== 'coach' && userRole !== 'coordinator') return

      try {
        if (userRole === 'coordinator') {
          // For coordinators, load ALL students
          const { data: students, error: studentError } = await supabase
            .from('user_profiles')
            .select(`
              id, 
              full_name, 
              email, 
              phone,
              department,
              school,
              tutoring_center,
              target_university,
              target_department,
              yks_score,
              start_date,
              parent_name,
              parent_phone,
              address,
              notes,
              created_at
            `)
            .eq('role', 'student')
            .order('full_name')

          console.log('All students from DB (coordinator):', students, studentError)

          if (studentError) {
            console.error('Student error:', studentError)
            setLoading(false)
            return
          }

          // Format as assignments for coordinator (with fake assignment data)
          const formattedAssignments = (students || []).map(student => ({
            id: `coord-${student.id}`, // Fake assignment ID for coordinator
            assigned_at: student.created_at,
            student
          }))

          console.log('Formatted assignments (coordinator):', formattedAssignments)
          setMyStudents(formattedAssignments)
        } else {
          // For coaches, load only assigned students
          const { data: assignments, error: assignmentError } = await supabase
            .from('coach_student_assignments')
            .select('id, assigned_at, student_id')
            .eq('coach_id', user.id)
            .eq('is_active', true)
            .order('assigned_at', { ascending: false })

          console.log('Raw assignments from DB:', assignments, assignmentError)

          if (assignmentError) {
            console.error('Assignment error:', assignmentError)
            setLoading(false)
            return
          }

          if (assignments && assignments.length > 0) {
            // Get student IDs
            const studentIds = assignments.map(a => a.student_id)
            
            // Fetch student details separately - including all profile fields
            const { data: students, error: studentError } = await supabase
              .from('user_profiles')
              .select(`
                id, 
                full_name, 
                email, 
                phone,
                department,
                school,
                tutoring_center,
                target_university,
                target_department,
                yks_score,
                start_date,
                parent_name,
                parent_phone,
                address,
                notes,
                created_at
              `)
              .in('id', studentIds)

            console.log('Students from DB:', students, studentError)

            if (studentError) {
              console.error('Student error:', studentError)
              setLoading(false)
              return
            }

            // Combine assignments with student data
            const formattedAssignments = assignments.map(assignment => {
              const student = students?.find(s => s.id === assignment.student_id) || {
                id: assignment.student_id,
                full_name: 'İsimsiz Öğrenci',
                email: '',
                created_at: ''
              }
              return {
                id: assignment.id,
                assigned_at: assignment.assigned_at,
                student
              }
            })

            console.log('Formatted assignments:', formattedAssignments)
            setMyStudents(formattedAssignments)
            
            // Don't auto-select any student - let coach choose
            console.log('Students loaded, coach can now select a student')
          } else {
            console.log('No assignments found for coach:', user.id)
            setMyStudents([])
          }
        }
      } catch (error) {
        console.error('Error loading students:', error)
      }
      
      setLoading(false)
    }

    loadStudents()
  }, [user, userRole])

  // Load subjects and topics
  useEffect(() => {
    const loadSubjects = async () => {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (subjects) {
        setSubjects(subjects)
      }
    }

    const loadTopics = async () => {
      const { data: topics } = await supabase
        .from('topics')
        .select('*')
        .eq('is_active', true)
        .order('subject_id, order_index, name')

      if (topics) {
        setTopics(topics)
      }
    }

    const loadResources = async () => {
      const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('is_active', true)
        .order('subject_id, name')

      if (resources) {
        setResources(resources)
      }
    }

    const loadMockExams = async () => {
      const { data: mockExams, error } = await supabase
        .from('mock_exams')
        .select('*')
        .eq('is_active', true)
        .order('subject_id, name')

      if (error) {
        console.error('Error loading mock exams:', error)
        return
      }

      if (mockExams) {
        setMockExams(mockExams)
      }
    }

    loadSubjects()
    loadTopics()
    loadResources()
    loadMockExams()
  }, [])

  // Load student goals
  useEffect(() => {
    const loadGoals = async () => {
      if (!selectedStudent) {
        setGoals([])
        return
      }

      try {
        const { data: goals, error } = await supabase
          .from('student_goals')
          .select('*')
          .eq('student_id', selectedStudent.id)
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading goals:', error)
          return
        }

        setGoals(goals || [])
      } catch (error) {
        console.error('Error loading goals:', error)
      }
    }

    loadGoals()
  }, [selectedStudent])

  // Load mock exam results
  useEffect(() => {
    const loadMockExamResults = async () => {
      if (!selectedStudent) {
        setMockExamResults([])
        return
      }

      try {
        const { data: examResults, error } = await supabase
          .from('mock_exam_results')
          .select('*')
          .eq('student_id', selectedStudent.id)
          .eq('is_active', true)
          .order('exam_date', { ascending: false })

        if (error) {
          console.error('Error loading exam results:', error)
          return
        }

        setMockExamResults(examResults || [])
      } catch (error) {
        console.error('Error loading exam results:', error)
      }
    }

    loadMockExamResults()
  }, [selectedStudent])

  // Load weekly tasks with real-time updates
  useEffect(() => {
    const loadWeeklyTasks = async () => {
      if (!selectedStudent || !user) return

      const weekStart = getWeekStart(currentWeek)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          subject_id,
          topic_id,
          resource_id,
          mock_exam_id,
          status,
          due_date,
          scheduled_date,
          scheduled_start_time,
          scheduled_end_time,
          estimated_duration,
          problem_count,
          priority,
          task_type,
          assigned_to,
          assigned_by,
          created_at,
          updated_at
        `)
        .eq('assigned_to', selectedStudent.id)
        .gte('scheduled_date', weekStart.toISOString().split('T')[0])
        .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
        .order('scheduled_date')
        .order('created_at')

      // For coaches: load tasks they assigned to the selected student
      // For students: load tasks assigned to them (by any coach)
      if (userRole === 'coach') {
        query = query.eq('assigned_by', user.id)
      }
      // For students, we don't filter by assigned_by, so they see all tasks assigned to them

      const { data: tasks } = await query

      if (tasks) {
        setWeeklyTasks(tasks)
      }
    }

    // Setup real-time subscription for task updates
    const setupRealtimeSubscription = () => {
      if (!selectedStudent || !user) return null

      try {
        console.log(`🔄 Setting up real-time subscription for student: ${selectedStudent.id}`)
        
        const subscription = supabase
          .channel(`task-updates-${selectedStudent.id}`, {
            config: {
              broadcast: { self: false }, // Don't broadcast to self to avoid duplicates
              presence: { key: user.id }
            }
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public', 
              table: 'tasks',
              filter: `assigned_to=eq.${selectedStudent.id}`
            },
            (payload) => {
              console.log('📡 Real-time task update received:', payload)
              
              if (payload.eventType === 'UPDATE') {
                console.log('📝 Updating task:', payload.new.id)
                setWeeklyTasks(prev => prev.map(task => 
                  task.id === payload.new.id 
                    ? { 
                        ...task, 
                        ...payload.new,
                        // Ensure completed_at is properly typed
                        completed_at: payload.new.completed_at || undefined
                      }
                    : task
                ))
              } else if (payload.eventType === 'INSERT') {
                console.log('➕ New task inserted:', payload.new.id)
                // Check if the new task is in the current week
                const taskDate = new Date(payload.new.scheduled_date)
                const weekStart = getWeekStart(currentWeek)
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekStart.getDate() + 6)
                
                if (taskDate >= weekStart && taskDate <= weekEnd) {
                  setWeeklyTasks(prev => [...prev, { 
                    ...payload.new, 
                    completed_at: payload.new.completed_at || undefined 
                  } as Task])
                }
              } else if (payload.eventType === 'DELETE') {
                console.log('🗑️ Task deleted:', payload.old.id)
                setWeeklyTasks(prev => prev.filter(task => task.id !== payload.old.id))
              }
            }
          )
          .subscribe((status) => {
            console.log(`📊 Subscription status for ${selectedStudent.id}:`, status)
            if (status === 'SUBSCRIBED') {
              console.log('✅ Real-time subscription active for tasks')
              setRealtimeConnected(true)
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Real-time subscription error')
              setRealtimeConnected(false)
            } else if (status === 'TIMED_OUT') {
              console.warn('⏰ Real-time subscription timed out')
              setRealtimeConnected(false)
            } else if (status === 'CLOSED') {
              console.log('🔒 Real-time subscription closed')
              setRealtimeConnected(false)
            }
          })

        return subscription
      } catch (error) {
        console.error('Error setting up real-time subscription:', error)
        setRealtimeConnected(false)
        return null
      }
    }

    loadWeeklyTasks()
    const subscription = setupRealtimeSubscription()

    // Cleanup subscription on unmount or dependency change
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [selectedStudent, currentWeek, user?.id, userRole])

  // Fallback polling mechanism when real-time is not connected
  useEffect(() => {
    if (!selectedStudent || !user || realtimeConnected) return

    console.log('⚠️ Real-time not connected, using polling fallback')
    
    const pollInterval = setInterval(async () => {
      try {
        const weekStart = getWeekStart(currentWeek)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)

        let query = supabase
          .from('tasks')
          .select(`
            id,
            title,
            description,
            subject_id,
            topic_id,
            resource_id,
            status,
            due_date,
            scheduled_date,
            scheduled_start_time,
            scheduled_end_time,
            estimated_duration,
            problem_count,
            priority,
            task_type,
            assigned_to,
            assigned_by,
            created_at,
            updated_at,
            completed_at
          `)
          .eq('assigned_to', selectedStudent.id)
          .gte('scheduled_date', weekStart.toISOString().split('T')[0])
          .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
          .order('scheduled_date')
          .order('created_at')

        if (userRole === 'coach') {
          query = query.eq('assigned_by', user.id)
        }

        const { data: tasks } = await query

        if (tasks) {
          setWeeklyTasks(prev => {
            // Only update if there are actual changes to prevent unnecessary re-renders
            const hasChanges = tasks.some(newTask => {
              const existingTask = prev.find(t => t.id === newTask.id)
              return !existingTask || 
                     existingTask.status !== newTask.status || 
                     existingTask.completed_at !== newTask.completed_at ||
                     existingTask.updated_at !== newTask.updated_at
            })
            
            return hasChanges ? tasks : prev
          })
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000) // Poll every 3 seconds when real-time is not working

    return () => clearInterval(pollInterval)
  }, [selectedStudent, currentWeek, user?.id, userRole, realtimeConnected])

  // Load educational links
  useEffect(() => {
    const loadEducationalLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('educational_links')
          .select('*')
          .eq('is_active', true)
          .in('target_audience', ['all', 'coaches'])
          .order('display_order', { ascending: true })

        if (error) throw error
        setEducationalLinks(data || [])
      } catch (error) {
        console.error('Error loading educational links:', error)
        setEducationalLinks([])
      }
    }

    loadEducationalLinks()
  }, [])

  // Calendar responsive width tracking
  useEffect(() => {
    const updateContainerWidth = () => {
      // Measure the grid container (actual available space)
      const gridElement = gridContainerRef.current
      const containerElement = calendarContainerRef.current
      
      if (gridElement) {
        const width = gridElement.clientWidth
        console.log('Measuring grid width:', width)
        setCalendarContainerWidth(width)
      } else if (containerElement) {
        const width = containerElement.clientWidth
        console.log('Measuring container width:', width)
        setCalendarContainerWidth(width)
      }
    }

    // Initial measurement with small delay to ensure DOM is ready
    const timer = setTimeout(updateContainerWidth, 100)

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width } = entry.contentRect
        console.log('ResizeObserver width:', width)
        setCalendarContainerWidth(width)
      }
    })

    const setupObserver = () => {
      // Observe both the container and grid for changes
      if (gridContainerRef.current) {
        resizeObserver.observe(gridContainerRef.current)
        console.log('Observing grid container')
      }
      if (calendarContainerRef.current) {
        resizeObserver.observe(calendarContainerRef.current)
        console.log('Observing calendar container')
      }
    }

    // Setup observer with delay
    setTimeout(setupObserver, 100)

    // Also listen to window resize as fallback
    window.addEventListener('resize', updateContainerWidth)
    
    // Add mutation observer to detect when resizable panels change
    const mutationObserver = new MutationObserver(() => {
      setTimeout(updateContainerWidth, 50)
    })
    
    if (calendarContainerRef.current) {
      mutationObserver.observe(calendarContainerRef.current.closest('[data-panel-group]') || document.body, {
        attributes: true,
        attributeFilter: ['style'],
        childList: false,
        subtree: true
      })
    }
    
    // Add interval-based checking for resizable panel changes
    const interval = setInterval(updateContainerWidth, 500)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('resize', updateContainerWidth)
    }
  }, [])

  // Force re-render when container width changes
  useEffect(() => {
    console.log('Container width state changed:', calendarContainerWidth)
  }, [calendarContainerWidth])

  // Calculate dynamic grid columns based on container width
  const getGridColumns = () => {
    // Get current width from multiple sources
    let currentWidth = calendarContainerWidth
    
    if (!currentWidth && gridContainerRef.current) {
      currentWidth = gridContainerRef.current.clientWidth
    }
    
    if (!currentWidth && calendarContainerRef.current) {
      currentWidth = calendarContainerRef.current.clientWidth
    }
    
    console.log('Getting columns - State width:', calendarContainerWidth, 'Current width:', currentWidth) // Debug log
    
    // Define breakpoints based on container width, not viewport
    if (currentWidth < 600) return 1      // Very small: 1 column
    if (currentWidth < 800) return 2      // Small: 2 columns  
    if (currentWidth < 1000) return 3     // Medium: 3 columns
    if (currentWidth < 1200) return 4     // Large: 4 columns
    if (currentWidth < 1400) return 5     // X-Large: 5 columns
    if (currentWidth < 1600) return 6     // XX-Large: 6 columns
    return 7                              // Full size: 7 columns (all days)
  }

  // Helper functions
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    return new Date(d.setDate(diff))
  }

  const getWeekDates = (date: Date) => {
    const weekStart = getWeekStart(date)
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      dates.push(d)
    }
    return dates
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
  }

  // Task creation functions
  const openTaskModal = (date: Date) => {
    setTaskModalDate(date)
    setTaskForm({
      title: '',
      description: '',
      subject_id: '',
      topic_id: '',
      resource_id: '',
      mock_exam_id: '',
      task_type: 'study',
      scheduled_start_time: '',
      scheduled_end_time: '',
      estimated_duration: 60,
      problem_count: 10
    })
    setShowTaskModal(true)
  }

  const closeTaskModal = () => {
    setShowTaskModal(false)
    setTaskModalDate(null)
    setEditingTask(null)
    setTaskForm({
      title: '',
      description: '',
      subject_id: '',
      topic_id: '',
      resource_id: '',
      mock_exam_id: '',
      task_type: 'study',
      scheduled_start_time: '',
      scheduled_end_time: '',
      estimated_duration: 60,
      problem_count: 10
    })
  }

  const createTask = async () => {
    if (!selectedStudent || !taskModalDate) {
      alert('Lütfen öğrenci seçin ve tarih belirleyin')
      return
    }

    // Validate resource selection for resource tasks
    if (taskForm.task_type === 'resource' && !taskForm.resource_id) {
      alert('Kaynak türü görevler için bir kaynak seçmelisiniz')
      return
    }

    // Validate mock exam selection for exam tasks
    if ((taskForm.task_type === 'exam' || taskForm.task_type === 'practice') && !taskForm.mock_exam_id) {
      alert('Sınav türü görevler için bir deneme sınavı seçmelisiniz')
      return
    }

    // Validate start time for coaching sessions
    if (taskForm.task_type === 'coaching_session' && !taskForm.scheduled_start_time) {
      alert('Koçluk seansları için başlangıç saati belirtmelisiniz')
      return
    }

    // Generate default title if not provided
    const taskTitle = taskForm.title.trim() || 'Görev'

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: taskTitle,
          description: taskForm.description.trim() || null,
          subject_id: taskForm.subject_id || null,
          topic_id: taskForm.topic_id || null,
          resource_id: taskForm.resource_id || null,
          mock_exam_id: taskForm.mock_exam_id || null,
          task_type: taskForm.task_type,
          scheduled_date: taskModalDate.toISOString().split('T')[0],
          scheduled_start_time: taskForm.scheduled_start_time || null,
          scheduled_end_time: taskForm.scheduled_end_time || null,
          estimated_duration: taskForm.estimated_duration,
          problem_count: taskForm.task_type === 'practice' ? taskForm.problem_count : null,
          status: 'pending',
          priority: 'medium',
          assigned_to: selectedStudent.id,
          assigned_by: user?.id
        })

      if (error) {
        console.error('Task creation error:', error)
        alert('Görev oluşturulurken hata oluştu')
        return
      }

      // Refresh tasks
      const weekStart = getWeekStart(currentWeek)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', selectedStudent.id)
        .eq('assigned_by', user?.id)
        .gte('scheduled_date', weekStart.toISOString().split('T')[0])
        .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
        .order('scheduled_date')
        .order('created_at')

      if (tasks) {
        setWeeklyTasks(tasks)
      }

      // Send notification for coaching sessions
      if (taskForm.task_type === 'coaching_session' && taskForm.scheduled_start_time) {
        try {
          console.log('📤 Sending coaching session notification...')
          
          const sessionDate = new Date(taskModalDate)
          const formattedDate = sessionDate.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            weekday: 'long'
          })
          
          const response = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: selectedStudent.id,
              title: '📅 Yeni Koçluk Seansı',
              body: `${taskTitle} - ${formattedDate} ${taskForm.scheduled_start_time}`,
              data: {
                type: 'new_coaching_session',
                taskId: 'task-created', // We don't have the ID yet, but that's ok
                taskTitle: taskTitle,
                sessionDate: taskModalDate.toISOString().split('T')[0],
                sessionTime: taskForm.scheduled_start_time,
                coachName: profile?.full_name || 'Koçunuz'
              }
            })
          })

          if (response.ok) {
            const result = await response.json()
            console.log('✅ Coaching session notification sent successfully:', result)
          } else {
            console.error('❌ Failed to send coaching session notification:', await response.text())
          }
        } catch (notificationError) {
          console.error('❌ Error sending coaching session notification:', notificationError)
          // Don't show error to user - task creation was successful
        }
      }

      closeTaskModal()
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Görev oluşturulurken hata oluştu')
    }
  }

  const handleTaskClick = (task: Task) => {
    // For all tasks (including resources), just toggle completion
    // Resource links are now handled separately via the resource name click
    toggleTaskCompletion(task)
  }

  const toggleTaskCompletion = async (task: Task) => {
    if (!selectedStudent) return

    // Prevent multiple simultaneous updates
    if (updatingTaskId === task.id) return

    // Permission check: Only allow the assigned student, coaches, or coordinators to toggle completion
    const canUpdate = userRole === 'coach' || userRole === 'coordinator' || (userRole === 'student' && user?.id === task.assigned_to)
    
    if (!canUpdate) {
      alert('Bu görevi tamamlama durumunu değiştirme yetkiniz yok.')
      return
    }

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const completedAt = newStatus === 'completed' ? new Date().toISOString() : undefined
    setUpdatingTaskId(task.id)

    try {
      // Use API route instead of direct Supabase call
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          completed_at: completedAt
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Task update error:', errorData)
        alert('Görev durumu güncellenirken hata oluştu: ' + (errorData.error || 'Bilinmeyen hata'))
        return
      }

      const { task: updatedTask } = await response.json()

      // Only update local state after successful API call
      setWeeklyTasks(prev => prev.map(t => 
        t.id === task.id 
          ? { ...t, status: newStatus, completed_at: completedAt }
          : t
      ))
      
      // Show success message for students
      if (userRole === 'student') {
        console.log(`Görev başarıyla ${newStatus === 'completed' ? 'tamamlandı' : 'beklemede'} olarak işaretlendi.`)
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Görev durumu güncellenirken hata oluştu.')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const getTasksForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return weeklyTasks.filter(task => task.scheduled_date === dateStr)
  }

  const openEditModal = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent task click
    setEditingTask(task)
    setTaskModalDate(new Date(task.scheduled_date))
    setTaskForm({
      title: task.title,
      description: task.description || '',
      subject_id: task.subject_id || '',
      topic_id: task.topic_id || '',
      resource_id: task.resource_id || '',
      mock_exam_id: task.mock_exam_id || '',
      task_type: task.task_type,
      scheduled_start_time: task.scheduled_start_time || '',
      scheduled_end_time: task.scheduled_end_time || '',
      estimated_duration: task.estimated_duration,
      problem_count: task.problem_count || 10
    })
    setShowTaskModal(true)
  }

  const updateTask = async () => {
    if (!editingTask || !taskModalDate) {
      alert('Düzenleme hatası')
      return
    }

    // Validate resource selection for resource tasks
    if (taskForm.task_type === 'resource' && !taskForm.resource_id) {
      alert('Kaynak türü görevler için bir kaynak seçmelisiniz')
      return
    }

    // Validate mock exam selection for exam tasks
    if ((taskForm.task_type === 'exam' || taskForm.task_type === 'practice') && !taskForm.mock_exam_id) {
      alert('Sınav türü görevler için bir deneme sınavı seçmelisiniz')
      return
    }

    // Generate default title if not provided
    const taskTitle = taskForm.title.trim() || 'Görev'

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: taskTitle,
          description: taskForm.description.trim() || null,
          subject_id: taskForm.subject_id || null,
          topic_id: taskForm.topic_id || null,
          resource_id: taskForm.resource_id || null,
          mock_exam_id: taskForm.mock_exam_id || null,
          task_type: taskForm.task_type,
          scheduled_date: taskModalDate.toISOString().split('T')[0],
          scheduled_start_time: taskForm.scheduled_start_time || null,
          scheduled_end_time: taskForm.scheduled_end_time || null,
          estimated_duration: taskForm.estimated_duration,
          problem_count: taskForm.task_type === 'practice' ? taskForm.problem_count : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTask.id)

      if (error) {
        console.error('Task update error:', error)
        alert('Görev güncellenirken hata oluştu')
        return
      }

      // Refresh tasks
      const weekStart = getWeekStart(currentWeek)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', selectedStudent?.id)
        .eq('assigned_by', user?.id)
        .gte('scheduled_date', weekStart.toISOString().split('T')[0])
        .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
        .order('scheduled_date')
        .order('created_at')

      if (tasks) {
        setWeeklyTasks(tasks)
      }

      closeTaskModal()
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Görev güncellenirken hata oluştu')
    }
  }

  const deleteTask = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent task click
    
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)

      if (error) {
        console.error('Task delete error:', error)
        alert('Görev silinirken hata oluştu')
        return
      }

      // Update local state
      setWeeklyTasks(prev => prev.filter(t => t.id !== task.id))
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Görev silinirken hata oluştu')
    }
  }

  // Goal management functions
  const openGoalModal = () => {
    if (!selectedStudent) return
    
    setGoalForm({
      goal_type: 'custom',
      title: '',
      description: '',
      target_value: '',
      current_value: '',
      target_date: '',
      priority: 'medium',
      status: 'active'
    })
    setEditingGoal(null)
    setShowGoalModal(true)
  }

  const openEditGoalModal = (goal: Goal) => {
    setGoalForm({
      goal_type: goal.goal_type,
      title: goal.title,
      description: goal.description || '',
      target_value: goal.target_value || '',
      current_value: goal.current_value || '',
      target_date: goal.target_date || '',
      priority: goal.priority,
      status: goal.status
    })
    setEditingGoal(goal)
    setShowGoalModal(true)
  }

  const closeGoalModal = () => {
    setShowGoalModal(false)
    setEditingGoal(null)
    setGoalForm({
      goal_type: 'custom',
      title: '',
      description: '',
      target_value: '',
      current_value: '',
      target_date: '',
      priority: 'medium',
      status: 'active'
    })
  }

  const createGoal = async () => {
    if (!selectedStudent || !goalForm.title.trim()) {
      alert('Hedef başlığı gereklidir.')
      return
    }

    // Get current user ID - try both user and profile
    const currentUserId = user?.id || profile?.id
    if (!currentUserId) {
      alert('Kullanıcı bilgisi bulunamadı. Lütfen yeniden giriş yapın.')
      return
    }

    console.log('Creating goal with:', {
      student_id: selectedStudent.id,
      coach_id: currentUserId,
      goal_type: goalForm.goal_type,
      title: goalForm.title
    })

    try {
      const { data, error } = await supabase
        .from('student_goals')
        .insert([{
          student_id: selectedStudent.id,
          coach_id: currentUserId,
          goal_type: goalForm.goal_type,
          title: goalForm.title.trim(),
          description: goalForm.description.trim() || null,
          target_value: goalForm.target_value.trim() || null,
          current_value: goalForm.current_value.trim() || null,
          target_date: goalForm.target_date || null,
          priority: goalForm.priority,
          status: goalForm.status,
          is_active: true,
          created_by: currentUserId
        }])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // Add to local state
      if (data && data[0]) {
        setGoals(prev => [...prev, data[0] as Goal])
        console.log('Goal created successfully:', data[0])
      }

      closeGoalModal()
    } catch (error) {
      console.error('Error creating goal:', error)
      alert(`Hedef oluşturulurken hata oluştu: ${(error as any)?.message || 'Bilinmeyen hata'}`)
    }
  }

  const updateGoal = async () => {
    if (!editingGoal || !goalForm.title.trim()) {
      alert('Hedef başlığı gereklidir.')
      return
    }

    console.log('Updating goal:', editingGoal.id, goalForm)

    try {
      const { data, error } = await supabase
        .from('student_goals')
        .update({
          goal_type: goalForm.goal_type,
          title: goalForm.title.trim(),
          description: goalForm.description.trim() || null,
          target_value: goalForm.target_value.trim() || null,
          current_value: goalForm.current_value.trim() || null,
          target_date: goalForm.target_date || null,
          priority: goalForm.priority,
          status: goalForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingGoal.id)
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // Update local state
      if (data && data[0]) {
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? data[0] as Goal : g))
        console.log('Goal updated successfully:', data[0])
      }

      closeGoalModal()
    } catch (error) {
      console.error('Error updating goal:', error)
      alert(`Hedef güncellenirken hata oluştu: ${(error as any)?.message || 'Bilinmeyen hata'}`)
    }
  }

  const deleteGoal = async (goal: Goal) => {
    if (!confirm('Bu hedefi silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('student_goals')
        .delete()
        .eq('id', goal.id)

      if (error) throw error

      // Update local state
      setGoals(prev => prev.filter(g => g.id !== goal.id))
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Hedef silinirken hata oluştu.')
    }
  }

  // Exam management functions
  const openExamModal = () => {
    setExamForm({
      exam_type: 'TYT',
      exam_date: new Date().toISOString().split('T')[0],
      exam_name: '',
      exam_duration: 180,
      
      // TYT Scores - Türkçe
      tyt_turkce_correct: 0,
      tyt_turkce_wrong: 0,
      
      // TYT Scores - Matematik
      tyt_matematik_correct: 0,
      tyt_matematik_wrong: 0,
      tyt_geometri_correct: 0,
      tyt_geometri_wrong: 0,
      
      // TYT Scores - Sosyal Bilimler
      tyt_tarih_correct: 0,
      tyt_tarih_wrong: 0,
      tyt_cografya_correct: 0,
      tyt_cografya_wrong: 0,
      tyt_felsefe_correct: 0,
      tyt_felsefe_wrong: 0,
      tyt_din_correct: 0,
      tyt_din_wrong: 0,
      
      // TYT Scores - Fen Bilimleri
      tyt_fizik_correct: 0,
      tyt_fizik_wrong: 0,
      tyt_kimya_correct: 0,
      tyt_kimya_wrong: 0,
      tyt_biyoloji_correct: 0,
      tyt_biyoloji_wrong: 0,
      
      // AYT Scores
      ayt_matematik_correct: 0,
      ayt_matematik_wrong: 0,
      ayt_geometri_correct: 0,
      ayt_geometri_wrong: 0,
      
      // Tarama Scores
      tarama_lessons: [],
      
      notes: ''
    })
    setExamModalTab('TYT')
    setEditingExam(null)
    setShowExamModal(true)
  }

  const openEditExamModal = (examResult: MockExamResult) => {
    setExamForm({
      exam_type: examResult.exam_type,
      exam_date: examResult.exam_date,
      exam_name: examResult.exam_name,
      exam_duration: examResult.exam_duration || 180,
      
      // TYT Scores - Türkçe
      tyt_turkce_correct: examResult.tyt_turkce_correct || 0,
      tyt_turkce_wrong: examResult.tyt_turkce_wrong || 0,
      
      // TYT Scores - Matematik
      tyt_matematik_correct: examResult.tyt_matematik_correct || 0,
      tyt_matematik_wrong: examResult.tyt_matematik_wrong || 0,
      tyt_geometri_correct: examResult.tyt_geometri_correct || 0,
      tyt_geometri_wrong: examResult.tyt_geometri_wrong || 0,
      
      // TYT Scores - Sosyal Bilimler
      tyt_tarih_correct: examResult.tyt_tarih_correct || 0,
      tyt_tarih_wrong: examResult.tyt_tarih_wrong || 0,
      tyt_cografya_correct: examResult.tyt_cografya_correct || 0,
      tyt_cografya_wrong: examResult.tyt_cografya_wrong || 0,
      tyt_felsefe_correct: examResult.tyt_felsefe_correct || 0,
      tyt_felsefe_wrong: examResult.tyt_felsefe_wrong || 0,
      tyt_din_correct: examResult.tyt_din_correct || 0,
      tyt_din_wrong: examResult.tyt_din_wrong || 0,
      
      // TYT Scores - Fen Bilimleri
      tyt_fizik_correct: examResult.tyt_fizik_correct || 0,
      tyt_fizik_wrong: examResult.tyt_fizik_wrong || 0,
      tyt_kimya_correct: examResult.tyt_kimya_correct || 0,
      tyt_kimya_wrong: examResult.tyt_kimya_wrong || 0,
      tyt_biyoloji_correct: examResult.tyt_biyoloji_correct || 0,
      tyt_biyoloji_wrong: examResult.tyt_biyoloji_wrong || 0,
      
      // AYT Scores
      ayt_matematik_correct: examResult.ayt_matematik_correct || 0,
      ayt_matematik_wrong: examResult.ayt_matematik_wrong || 0,
      ayt_geometri_correct: examResult.ayt_geometri_correct || 0,
      ayt_geometri_wrong: examResult.ayt_geometri_wrong || 0,
      
      // Tarama Scores
      tarama_lessons: examResult.tarama_lessons || [],
      
      notes: examResult.notes || ''
    })
    setExamModalTab(examResult.exam_type)
    setEditingExam(examResult)
    setShowExamModal(true)
  }

  const closeExamModal = () => {
    setShowExamModal(false)
    setEditingExam(null)
    setExamModalTab('TYT')
  }

  const createExamResult = async () => {
    if (!selectedStudent || !user) return

    try {
      const { data, error } = await supabase
        .from('mock_exam_results')
        .insert([{
          student_id: selectedStudent.id,
          coach_id: user.id,
          exam_type: examForm.exam_type,
          exam_date: examForm.exam_date,
          exam_name: examForm.exam_name.trim(),
          exam_duration: examForm.exam_duration,
          
                    // Only include relevant scores based on exam type
          ...(examForm.exam_type === 'TYT' ? {
            // TYT Scores - Türkçe
            tyt_turkce_correct: examForm.tyt_turkce_correct,
            tyt_turkce_wrong: examForm.tyt_turkce_wrong,
            
            // TYT Scores - Matematik
            tyt_matematik_correct: examForm.tyt_matematik_correct,
            tyt_matematik_wrong: examForm.tyt_matematik_wrong,
            tyt_geometri_correct: examForm.tyt_geometri_correct,
            tyt_geometri_wrong: examForm.tyt_geometri_wrong,
            
            // TYT Scores - Sosyal Bilimler
            tyt_tarih_correct: examForm.tyt_tarih_correct,
            tyt_tarih_wrong: examForm.tyt_tarih_wrong,
            tyt_cografya_correct: examForm.tyt_cografya_correct,
            tyt_cografya_wrong: examForm.tyt_cografya_wrong,
            tyt_felsefe_correct: examForm.tyt_felsefe_correct,
            tyt_felsefe_wrong: examForm.tyt_felsefe_wrong,
            tyt_din_correct: examForm.tyt_din_correct,
            tyt_din_wrong: examForm.tyt_din_wrong,
            
            // TYT Scores - Fen Bilimleri
            tyt_fizik_correct: examForm.tyt_fizik_correct,
            tyt_fizik_wrong: examForm.tyt_fizik_wrong,
            tyt_kimya_correct: examForm.tyt_kimya_correct,
            tyt_kimya_wrong: examForm.tyt_kimya_wrong,
            tyt_biyoloji_correct: examForm.tyt_biyoloji_correct,
            tyt_biyoloji_wrong: examForm.tyt_biyoloji_wrong,
          } : examForm.exam_type === 'AYT' ? {
            ayt_matematik_correct: examForm.ayt_matematik_correct,
            ayt_matematik_wrong: examForm.ayt_matematik_wrong,
            ayt_geometri_correct: examForm.ayt_geometri_correct,
            ayt_geometri_wrong: examForm.ayt_geometri_wrong,
          } : {
            // Tarama Scores
            tarama_lessons: examForm.tarama_lessons.map(lesson => ({
              ...lesson,
              net: lesson.correct - lesson.wrong / 4
            })),
            tarama_total_net: examForm.tarama_lessons.reduce((sum, lesson) => sum + (lesson.correct - lesson.wrong / 4), 0),
          }),
          
          notes: examForm.notes.trim() || null
        }])
        .select()

      if (error) {
        console.error('Exam result creation error:', error)
        alert(`Sınav sonucu eklenirken hata oluştu: ${error.message}`)
        return
      }

      console.log('Exam result created successfully:', data)
      
      // Add to local state
      if (data && data[0]) {
        setMockExamResults(prev => [data[0], ...prev])
      }

      closeExamModal()
      alert('Sınav sonucu başarıyla eklendi!')
    } catch (error) {
      console.error('Error creating exam result:', error)
      alert(`Sınav sonucu eklenirken hata oluştu: ${(error as any)?.message || 'Bilinmeyen hata'}`)
    }
  }

  const updateExamResult = async () => {
    if (!selectedStudent || !user || !editingExam) return

    try {
      const { data, error } = await supabase
        .from('mock_exam_results')
        .update({
          exam_type: examForm.exam_type,
          exam_date: examForm.exam_date,
          exam_name: examForm.exam_name.trim(),
          exam_duration: examForm.exam_duration,
          
          // Only include relevant scores based on exam type
          ...(examForm.exam_type === 'TYT' ? {
            // TYT Scores - Türkçe
            tyt_turkce_correct: examForm.tyt_turkce_correct,
            tyt_turkce_wrong: examForm.tyt_turkce_wrong,
            
            // TYT Scores - Matematik
            tyt_matematik_correct: examForm.tyt_matematik_correct,
            tyt_matematik_wrong: examForm.tyt_matematik_wrong,
            tyt_geometri_correct: examForm.tyt_geometri_correct,
            tyt_geometri_wrong: examForm.tyt_geometri_wrong,
            
            // TYT Scores - Sosyal Bilimler
            tyt_tarih_correct: examForm.tyt_tarih_correct,
            tyt_tarih_wrong: examForm.tyt_tarih_wrong,
            tyt_cografya_correct: examForm.tyt_cografya_correct,
            tyt_cografya_wrong: examForm.tyt_cografya_wrong,
            tyt_felsefe_correct: examForm.tyt_felsefe_correct,
            tyt_felsefe_wrong: examForm.tyt_felsefe_wrong,
            tyt_din_correct: examForm.tyt_din_correct,
            tyt_din_wrong: examForm.tyt_din_wrong,
            
            // TYT Scores - Fen Bilimleri
            tyt_fizik_correct: examForm.tyt_fizik_correct,
            tyt_fizik_wrong: examForm.tyt_fizik_wrong,
            tyt_kimya_correct: examForm.tyt_kimya_correct,
            tyt_kimya_wrong: examForm.tyt_kimya_wrong,
            tyt_biyoloji_correct: examForm.tyt_biyoloji_correct,
            tyt_biyoloji_wrong: examForm.tyt_biyoloji_wrong,
            
            // Clear AYT and Tarama fields
            ayt_matematik_correct: null,
            ayt_matematik_wrong: null,
            ayt_geometri_correct: null,
            ayt_geometri_wrong: null,
            tarama_lessons: null,
          } : examForm.exam_type === 'AYT' ? {
            // AYT Scores
            ayt_matematik_correct: examForm.ayt_matematik_correct,
            ayt_matematik_wrong: examForm.ayt_matematik_wrong,
            ayt_geometri_correct: examForm.ayt_geometri_correct,
            ayt_geometri_wrong: examForm.ayt_geometri_wrong,
            
            // Clear TYT and Tarama fields
            tyt_turkce_correct: null,
            tyt_turkce_wrong: null,
            tyt_matematik_correct: null,
            tyt_matematik_wrong: null,
            tyt_geometri_correct: null,
            tyt_geometri_wrong: null,
            tyt_tarih_correct: null,
            tyt_tarih_wrong: null,
            tyt_cografya_correct: null,
            tyt_cografya_wrong: null,
            tyt_felsefe_correct: null,
            tyt_felsefe_wrong: null,
            tyt_din_correct: null,
            tyt_din_wrong: null,
            tyt_fizik_correct: null,
            tyt_fizik_wrong: null,
            tyt_kimya_correct: null,
            tyt_kimya_wrong: null,
            tyt_biyoloji_correct: null,
            tyt_biyoloji_wrong: null,
            tarama_lessons: null,
          } : {
            // Tarama Scores
            tarama_lessons: examForm.tarama_lessons.map(lesson => ({
              ...lesson,
              net: lesson.correct - lesson.wrong / 4
            })),
            tarama_total_net: examForm.tarama_lessons.reduce((sum, lesson) => sum + (lesson.correct - lesson.wrong / 4), 0),
            
            // Clear TYT and AYT fields
            tyt_turkce_correct: null,
            tyt_turkce_wrong: null,
            tyt_matematik_correct: null,
            tyt_matematik_wrong: null,
            tyt_geometri_correct: null,
            tyt_geometri_wrong: null,
            tyt_tarih_correct: null,
            tyt_tarih_wrong: null,
            tyt_cografya_correct: null,
            tyt_cografya_wrong: null,
            tyt_felsefe_correct: null,
            tyt_felsefe_wrong: null,
            tyt_din_correct: null,
            tyt_din_wrong: null,
            tyt_fizik_correct: null,
            tyt_fizik_wrong: null,
            tyt_kimya_correct: null,
            tyt_kimya_wrong: null,
            tyt_biyoloji_correct: null,
            tyt_biyoloji_wrong: null,
            ayt_matematik_correct: null,
            ayt_matematik_wrong: null,
            ayt_geometri_correct: null,
            ayt_geometri_wrong: null,
          }),
          
          notes: examForm.notes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingExam.id)
        .select()

       if (error) {
         console.error('Exam result update error:', error)
         alert(`Sınav sonucu güncellenirken hata oluştu: ${error.message}`)
         return
       }

       console.log('Exam result updated successfully:', data)
       
       // Update local state
       if (data && data[0]) {
         setMockExamResults(prev => prev.map(result => 
           result.id === editingExam.id ? data[0] : result
         ))
       }

       closeExamModal()
       alert('Sınav sonucu başarıyla güncellendi!')
     } catch (error) {
       console.error('Error updating exam result:', error)
       alert(`Sınav sonucu güncellenirken hata oluştu: ${(error as any)?.message || 'Bilinmeyen hata'}`)
     }
   }

  const deleteExamResult = async (examResult: MockExamResult) => {
    if (!confirm('Bu sınav sonucunu silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('mock_exam_results')
        .update({ is_active: false })
        .eq('id', examResult.id)

      if (error) {
        console.error('Error deleting exam result:', error)
        alert(`Sınav sonucu silinirken hata oluştu: ${error.message}`)
        return
      }

      // Remove from local state
      setMockExamResults(prev => prev.filter(result => result.id !== examResult.id))
      alert('Sınav sonucu başarıyla silindi!')
    } catch (error) {
      console.error('Error deleting exam result:', error)
      alert(`Sınav sonucu silinirken hata oluştu: ${(error as any)?.message || 'Bilinmeyen hata'}`)
    }
  }

  // Auto-populate profile form when student changes
  useEffect(() => {
    if (selectedStudent) {
      setProfileForm({
        full_name: selectedStudent.full_name || '',
        email: selectedStudent.email || '',
        phone: selectedStudent.phone || '',
        department: selectedStudent.department || '',
        school: selectedStudent.school || '',
        tutoring_center: selectedStudent.tutoring_center || '',
        target_university: selectedStudent.target_university || '',
        target_department: selectedStudent.target_department || '',
        yks_score: selectedStudent.yks_score ? String(selectedStudent.yks_score) : '',
        start_date: selectedStudent.start_date || '',
        parent_name: selectedStudent.parent_name || '',
        parent_phone: selectedStudent.parent_phone || '',
        address: selectedStudent.address || '',
        notes: selectedStudent.notes || ''
      })
    }
  }, [selectedStudent])



  const saveProfile = async () => {
    if (!selectedStudent) return

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profileForm.full_name.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim() || null,
          department: profileForm.department.trim() || null,
          school: profileForm.school.trim() || null,
          tutoring_center: profileForm.tutoring_center.trim() || null,
          target_university: profileForm.target_university.trim() || null,
          target_department: profileForm.target_department.trim() || null,
          yks_score: profileForm.yks_score ? parseInt(profileForm.yks_score) : null,
          start_date: profileForm.start_date || null,
          parent_name: profileForm.parent_name.trim() || null,
          parent_phone: profileForm.parent_phone.trim() || null,
          address: profileForm.address.trim() || null,
          notes: profileForm.notes.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStudent.id)
        .select()

      if (error) {
        console.error('Profile update error:', error)
        throw error
      }

      // Update local state
      if (data && data[0]) {
        setSelectedStudent(prev => prev ? { ...prev, ...data[0] } : null)
        // Also update in myStudents array
        setMyStudents(prev => prev.map(assignment => 
          assignment.student.id === selectedStudent.id 
            ? { ...assignment, student: { ...assignment.student, ...data[0] } }
            : assignment
        ))
      }

      alert('Profil başarıyla güncellendi!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(`Profil güncellenirken hata oluştu: ${(error as any)?.message || 'Bilinmeyen hata'}`)
    }
  }

  const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
  const weekDates = getWeekDates(currentWeek)

  // Place these at the top level of the component, with other useState hooks
  const [selectedTaramaSubject, setSelectedTaramaSubject] = React.useState('');
  const [selectedTaramaQuestionCount, setSelectedTaramaQuestionCount] = React.useState(10);
  const [showMonthlyStats, setShowMonthlyStats] = React.useState(false);

  // Add this function after other helper functions
  const calculateMonthlyStats = () => {
    if (!selectedStudent || !weeklyTasks.length) return []

    const monthStart = new Date(currentWeek)
    monthStart.setDate(1)
    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthStart.getMonth() + 1)
    monthEnd.setDate(0)

    // Filter tasks for the current month
    const monthlyTasks = weeklyTasks.filter(task => {
      const taskDate = new Date(task.scheduled_date)
      return taskDate >= monthStart && taskDate <= monthEnd && task.status === 'completed'
    })

    // Group by subject and calculate total problems
    const subjectStats = subjects.map(subject => {
      const subjectTasks = monthlyTasks.filter(task => task.subject_id === subject.id)
      const totalProblems = subjectTasks.reduce((sum, task) => sum + (task.problem_count || 0), 0)
      return {
        subject: subject.name,
        totalProblems
      }
    }).filter(stat => stat.totalProblems > 0)

    return subjectStats
  }

  // Add this function to calculate weekly stats
  const calculateWeeklyStats = () => {
    if (!selectedStudent || !weeklyTasks.length) return []

    const weekStart = getWeekStart(currentWeek)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    // Filter tasks for the current week
    const weekTasks = weeklyTasks.filter(task => {
      const taskDate = new Date(task.scheduled_date)
      return taskDate >= weekStart && taskDate <= weekEnd && task.status === 'completed'
    })

    // Group by subject and calculate total problems
    const subjectStats = subjects.map(subject => {
      const subjectTasks = weekTasks.filter(task => task.subject_id === subject.id)
      const totalProblems = subjectTasks.reduce((sum, task) => sum + (task.problem_count || 0), 0)
      return {
        subject: subject.name,
        totalProblems
      }
    }).filter(stat => stat.totalProblems > 0)

    return subjectStats
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">{userRole === 'coach' ? 'Koç paneli yükleniyor...' : userRole === 'coordinator' ? 'Koordinatör paneli yükleniyor...' : 'Öğrenci paneli yükleniyor...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Dark Theme */}
      <header className="bg-slate-800 shadow-lg border-b border-slate-700">
        <div className="max-w-full mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo - Dark Theme */}
            <div className="flex items-center">
              <GraduationCap className="h-7 w-7 text-blue-400 mr-2.5" />
              <h1 className="text-lg font-medium text-white">
                ÖZGÜN Koçluk Sistemi - {userRole === 'coach' ? 'Koç' : userRole === 'coordinator' ? 'Koordinatör' : 'Öğrenci'} Paneli
              </h1>
            </div>
            
            {/* Student Selection & User Menu - Dark Theme */}
            <div className="flex items-center space-x-4">
              {/* Conditional Header - Student Selector for Coach/Coordinator, Coach Info for Student */}
              {(userRole === 'coach' || userRole === 'coordinator') ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-300">Aktif Öğrenci:</span>
                  {myStudents.length > 0 ? (
                    <select
                      value={selectedStudent?.id || ''}
                      onChange={(e) => {
                        if (e.target.value === '') {
                          setSelectedStudent(null)
                        } else {
                          const student = myStudents.find(s => s.student.id === e.target.value)?.student
                          setSelectedStudent(student || null)
                        }
                      }}
                      className="border border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[200px] bg-slate-700 text-white"
                    >
                      <option value="">Öğrenci seçiniz...</option>
                      {myStudents.map(assignment => (
                        <option key={assignment.student.id} value={assignment.student.id}>
                          {assignment.student.full_name || 'İsimsiz Öğrenci'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-gray-400 italic bg-slate-700 px-3 py-2 rounded-md">
                      Henüz öğrenci ataması yapılmamış
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-300">Koçunuz:</span>
                  {assignedCoach ? (
                    <div className="flex items-center space-x-2 bg-green-600 px-3 py-2 rounded-md">
                      <div className="w-6 h-6 bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {assignedCoach.full_name?.charAt(0) || 'K'}
                      </div>
                      <span className="text-sm font-medium text-white">{assignedCoach.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic bg-slate-700 px-3 py-2 rounded-md">
                      Koç atanmamış
                    </span>
                  )}
                </div>
              )}
              
              {/* User Avatar with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800 overflow-hidden"
                  title={profile?.full_name || 'Koç'}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile?.full_name || 'Koç'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'K'}
                    </span>
                  )}
                </button>
                
                {/* Dropdown Menu - Dark Theme */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-md shadow-xl py-1 z-50 border border-slate-600">
                    <div className="px-4 py-2 text-sm text-gray-200 border-b border-slate-600">
                      <div className="font-medium">{profile?.full_name || (userRole === 'coach' ? 'Koç' : userRole === 'coordinator' ? 'Koordinatör' : 'Öğrenci')}</div>
                      <div className="text-xs text-gray-400">{userRole === 'coach' ? 'Koç' : userRole === 'coordinator' ? 'Koordinatör' : 'Öğrenci'}</div>
                    </div>
                    <button
                      onClick={openSettingsModal}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-slate-600"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Ayarlar
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-600"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingTask ? 'Görev Düzenle' : 'Yeni Görev'}
              </h3>
              <button
                onClick={closeTaskModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Task Type - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Görev Türü *
                </label>
                <select
                  value={taskForm.task_type}
                  onChange={(e) => setTaskForm(prev => ({ 
                    ...prev, 
                    task_type: e.target.value as any,
                    topic_id: '', // Reset topic when task type changes
                    resource_id: '', // Reset resource when task type changes
                    mock_exam_id: '' // Reset mock exam when task type changes
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="study">Çalışma</option>
                  <option value="practice">Soru çöz</option>
                  <option value="exam">Sınav</option>
                  <option value="review">Tekrar</option>
                  <option value="resource">Kaynak</option>
                  <option value="coaching_session">Koçluk Seansı</option>
                </select>
              </div>

              {/* Subject - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ders (Opsiyonel)
                </label>
                <select
                  value={taskForm.subject_id}
                  onChange={(e) => setTaskForm(prev => ({ 
                    ...prev, 
                    subject_id: e.target.value,
                    topic_id: '', // Reset topic when subject changes
                    resource_id: '', // Reset resource when subject changes
                    mock_exam_id: '' // Reset mock exam when subject changes
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Ders seçiniz...</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Second Selection based on Task Type */}
              {(taskForm.task_type === 'study' || taskForm.task_type === 'review') && taskForm.subject_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konu (Opsiyonel)
                  </label>
                  <select
                    value={taskForm.topic_id}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, topic_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Konu seçiniz...</option>
                    {topics
                      .filter(topic => topic.subject_id === taskForm.subject_id)
                      .map(topic => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Topic Selection - For practice task type after subject selection */}
              {taskForm.task_type === 'practice' && taskForm.subject_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konu (Opsiyonel)
                  </label>
                  <select
                    value={taskForm.topic_id}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, topic_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Konu seçiniz...</option>
                    {topics
                      .filter(topic => topic.subject_id === taskForm.subject_id)
                      .map(topic => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Mock Exam Selection - For exam and practice task types */}
              {(taskForm.task_type === 'exam' || taskForm.task_type === 'practice') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deneme Sınavı *
                  </label>
                  <select
                    value={taskForm.mock_exam_id}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, mock_exam_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Deneme sınavı seçiniz...</option>
                    {mockExams
                      .filter(mockExam => !taskForm.subject_id || mockExam.subject_id === taskForm.subject_id)
                      .map(mockExam => (
                        <option key={mockExam.id} value={mockExam.id}>
                          {mockExam.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Resource Selection - For resource task type */}
              {taskForm.task_type === 'resource' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kaynak Seçimi *
                  </label>
                  <select
                    value={taskForm.resource_id}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, resource_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Kaynak seçiniz...</option>
                    {resources
                      .filter(resource => !taskForm.subject_id || resource.subject_id === taskForm.subject_id)
                      .map(resource => (
                        <option key={resource.id} value={resource.id}>
                          {resource.name} ({resource.category.toUpperCase()})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Task Description - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Görev Açıklaması (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Görev açıklaması..."
                />
              </div>

              {/* Problem Count - Only for practice tasks */}
              {taskForm.task_type === 'practice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soru Sayısı
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={taskForm.problem_count}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, problem_count: parseInt(e.target.value) || 10 }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Çözülecek soru sayısı"
                  />
                </div>
              )}

              {/* Start Time - Required for coaching sessions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlangıç {taskForm.task_type === 'coaching_session' ? '*' : '(Opsiyonel)'}
                </label>
                <input
                  type="time"
                  value={taskForm.scheduled_start_time}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, scheduled_start_time: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={taskForm.task_type === 'coaching_session'}
                />
              </div>

              {/* Duration - Optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Süre (Opsiyonel)
                </label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={taskForm.estimated_duration}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 60 }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dakika cinsinden"
                />
              </div>

              {/* Date Display */}
              <div className="bg-gray-50 p-3 rounded-md">
                <span className="text-sm text-gray-600">
                  Tarih: {taskModalDate?.toLocaleDateString('tr-TR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={closeTaskModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={editingTask ? updateTask : createTask}
                disabled={!selectedStudent}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingTask ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Creation/Edit Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md mx-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold">
                {editingGoal ? 'Hedef Düzenle' : 'Yeni Hedef'}
              </h3>
              <button
                onClick={closeGoalModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={e => { e.preventDefault(); (editingGoal ? updateGoal() : createGoal()); }}
              className="space-y-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Goal Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Hedef Türü *</label>
                  <select
                    value={goalForm.goal_type}
                    onChange={e => setGoalForm(prev => ({ ...prev, goal_type: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="custom">Özel Hedef</option>
                    <option value="tyt_target">TYT Puan Hedefi</option>
                    <option value="ayt_target">AYT Puan Hedefi</option>
                    <option value="university_target">Üniversite Hedefi</option>
                    <option value="department_target">Bölüm Hedefi</option>
                    <option value="study_hours">Çalışma Saati Hedefi</option>
                  </select>
                </div>
                {/* Goal Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Hedef Başlığı *</label>
                  <input
                    type="text"
                    value={goalForm.title}
                    onChange={e => setGoalForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hedef başlığı..."
                    required
                  />
                </div>
                {/* Target Value */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Hedef Değeri</label>
                  <input
                    type="text"
                    value={goalForm.target_value}
                    onChange={e => setGoalForm(prev => ({ ...prev, target_value: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: 450, 8 saat, vs..."
                  />
                </div>
                {/* Current Value */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Mevcut Değer</label>
                  <input
                    type="text"
                    value={goalForm.current_value}
                    onChange={e => setGoalForm(prev => ({ ...prev, current_value: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mevcut durum..."
                  />
                </div>
                {/* Target Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Hedef Tarihi</label>
                  <input
                    type="date"
                    value={goalForm.target_date}
                    onChange={e => setGoalForm(prev => ({ ...prev, target_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Priority */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Öncelik *</label>
                  <select
                    value={goalForm.priority}
                    onChange={e => setGoalForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Durum *</label>
                  <select
                    value={goalForm.status}
                    onChange={e => setGoalForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Aktif</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="paused">Duraklatıldı</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                </div>
              </div>
              {/* Description - full width */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Açıklama</label>
                <textarea
                  value={goalForm.description}
                  onChange={e => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Hedef açıklaması..."
                  rows={2}
                />
              </div>
              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={closeGoalModal}
                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md text-xs"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!selectedStudent || !goalForm.title.trim()}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {editingGoal ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exam Result Creation Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingExam ? 'Sınav Sonucu Düzenle' : 'Sınav Sonucu Ekle'}
              </h3>
              <button
                onClick={closeExamModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Exam Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sınav Adı *
                  </label>
                  <input
                    type="text"
                    value={examForm.exam_name}
                    onChange={(e) => setExamForm(prev => ({ ...prev, exam_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: 1. Deneme Sınavı"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sınav Tarihi *
                  </label>
                  <input
                    type="date"
                    value={examForm.exam_date}
                    onChange={(e) => setExamForm(prev => ({ ...prev, exam_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Süre (dakika)
                  </label>
                  <input
                    type="number"
                    value={examForm.exam_duration}
                    onChange={(e) => setExamForm(prev => ({ ...prev, exam_duration: parseInt(e.target.value) || 180 }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="60"
                    max="300"
                  />
                </div>
              </div>

              {/* Exam Type Tabs */}
              <div>
                <div className="flex border-b">
                  <button
                    onClick={() => {
                      setExamModalTab('TYT')
                      setExamForm(prev => ({ ...prev, exam_type: 'TYT' }))
                    }}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                      examModalTab === 'TYT'
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    TYT Sınavı
                  </button>
                  <button
                    onClick={() => {
                      setExamModalTab('AYT')
                      setExamForm(prev => ({ ...prev, exam_type: 'AYT' }))
                    }}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                      examModalTab === 'AYT'
                        ? 'border-purple-500 text-purple-600 bg-purple-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    AYT Sınavı
                  </button>
                  <button
                    onClick={() => {
                      setExamModalTab('Tarama')
                      setExamForm(prev => ({ ...prev, exam_type: 'Tarama' }))
                    }}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                      examModalTab === 'Tarama'
                        ? 'border-green-500 text-green-600 bg-green-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Tarama Sınavı
                  </button>
                </div>

                {/* TYT Scores */}
                {examModalTab === 'TYT' && (
                  <div className="mt-6 space-y-4">
                    <h4 className="font-medium text-gray-800 flex items-center">
                      📝 TYT Sınav Sonuçları
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Türkçe */}
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <h5 className="font-medium text-blue-800 mb-3 flex items-center">
                          📚 Türkçe (40)
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-blue-700 mb-1">Doğru</label>
                            <input
                              type="number"
                              value={examForm.tyt_turkce_correct}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_turkce_correct: Math.max(0, Math.min(40, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-blue-200 rounded px-2 py-1 text-sm"
                              min="0" max="40"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-blue-700 mb-1">Yanlış</label>
                            <input
                              type="number"
                              value={examForm.tyt_turkce_wrong}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_turkce_wrong: Math.max(0, Math.min(40, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-blue-200 rounded px-2 py-1 text-sm"
                              min="0" max="40"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-blue-600">
                          Net: {(examForm.tyt_turkce_correct - examForm.tyt_turkce_wrong / 4).toFixed(1)}
                        </div>
                      </div>

                      {/* Matematik */}
                      <div className="border rounded-lg p-4 bg-green-50">
                        <h5 className="font-medium text-green-800 mb-3 flex items-center">
                          🔢 Matematik (30)
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-green-700 mb-1">Doğru</label>
                            <input
                              type="number"
                              value={examForm.tyt_matematik_correct}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_matematik_correct: Math.max(0, Math.min(30, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-green-200 rounded px-2 py-1 text-sm"
                              min="0" max="30"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-green-700 mb-1">Yanlış</label>
                            <input
                              type="number"
                              value={examForm.tyt_matematik_wrong}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_matematik_wrong: Math.max(0, Math.min(30, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-green-200 rounded px-2 py-1 text-sm"
                              min="0" max="30"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-green-600">
                          Net: {(examForm.tyt_matematik_correct - examForm.tyt_matematik_wrong / 4).toFixed(1)}
                        </div>
                      </div>

                      {/* Geometri */}
                      <div className="border rounded-lg p-4 bg-green-50">
                        <h5 className="font-medium text-green-800 mb-3 flex items-center">
                          📐 Geometri (10)
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-green-700 mb-1">Doğru</label>
                            <input
                              type="number"
                              value={examForm.tyt_geometri_correct}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_geometri_correct: Math.max(0, Math.min(10, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-green-200 rounded px-2 py-1 text-sm"
                              min="0" max="10"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-green-700 mb-1">Yanlış</label>
                            <input
                              type="number"
                              value={examForm.tyt_geometri_wrong}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_geometri_wrong: Math.max(0, Math.min(10, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-green-200 rounded px-2 py-1 text-sm"
                              min="0" max="10"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-green-600">
                          Net: {(examForm.tyt_geometri_correct - examForm.tyt_geometri_wrong / 4).toFixed(1)}
                        </div>
                      </div>

                      {/* Tarih */}
                      <div className="border rounded-lg p-4 bg-purple-50">
                        <h5 className="font-medium text-purple-800 mb-3 flex items-center">
                          📜 Tarih (5)
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-purple-700 mb-1">Doğru</label>
                            <input
                              type="number"
                              value={examForm.tyt_tarih_correct}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_tarih_correct: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-purple-200 rounded px-2 py-1 text-sm"
                              min="0" max="5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-purple-700 mb-1">Yanlış</label>
                            <input
                              type="number"
                              value={examForm.tyt_tarih_wrong}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_tarih_wrong: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-purple-200 rounded px-2 py-1 text-sm"
                              min="0" max="5"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-purple-600">
                          Net: {(examForm.tyt_tarih_correct - examForm.tyt_tarih_wrong / 4).toFixed(1)}
                        </div>
                      </div>

                      {/* Coğrafya */}
                      <div className="border rounded-lg p-4 bg-purple-50">
                        <h5 className="font-medium text-purple-800 mb-3 flex items-center">
                          🌍 Coğrafya (5)
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-purple-700 mb-1">Doğru</label>
                            <input
                              type="number"
                              value={examForm.tyt_cografya_correct}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_cografya_correct: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-purple-200 rounded px-2 py-1 text-sm"
                              min="0" max="5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-purple-700 mb-1">Yanlış</label>
                            <input
                              type="number"
                              value={examForm.tyt_cografya_wrong}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_cografya_wrong: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-purple-200 rounded px-2 py-1 text-sm"
                              min="0" max="5"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-purple-600">
                          Net: {(examForm.tyt_cografya_correct - examForm.tyt_cografya_wrong / 4).toFixed(1)}
                        </div>
                      </div>

                      {/* Felsefe */}
                      <div className="border rounded-lg p-4 bg-purple-50">
                        <h5 className="font-medium text-purple-800 mb-3 flex items-center">
                          🤔 Felsefe (5)
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-purple-700 mb-1">Doğru</label>
                            <input
                              type="number"
                              value={examForm.tyt_felsefe_correct}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_felsefe_correct: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-purple-200 rounded px-2 py-1 text-sm"
                              min="0" max="5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-purple-700 mb-1">Yanlış</label>
                            <input
                              type="number"
                              value={examForm.tyt_felsefe_wrong}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_felsefe_wrong: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-purple-200 rounded px-2 py-1 text-sm"
                              min="0" max="5"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-purple-600">
                          Net: {(examForm.tyt_felsefe_correct - examForm.tyt_felsefe_wrong / 4).toFixed(1)}
                        </div>
                      </div>

                      {/* Din Bilgisi */}
                      <div className="border rounded-lg p-4 bg-purple-50">
                        <h5 className="font-medium text-purple-800 mb-3 flex items-center">
                          🕌 Din Bilgisi (5)
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-purple-700 mb-1">Doğru</label>
                            <input
                              type="number"
                              value={examForm.tyt_din_correct}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_din_correct: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-purple-200 rounded px-2 py-1 text-sm"
                              min="0" max="5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-purple-700 mb-1">Yanlış</label>
                            <input
                              type="number"
                              value={examForm.tyt_din_wrong}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_din_wrong: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-purple-200 rounded px-2 py-1 text-sm"
                              min="0" max="5"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-purple-600">
                          Net: {(examForm.tyt_din_correct - examForm.tyt_din_wrong / 4).toFixed(1)}
                        </div>
                      </div>

                      {/* Fizik */}
                      <div className="border rounded-lg p-4 bg-orange-50">
                        <h5 className="font-medium text-orange-800 mb-3 flex items-center">
                          ⚡ Fizik (7)
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-orange-700 mb-1">Doğru</label>
                            <input
                              type="number"
                              value={examForm.tyt_fizik_correct}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_fizik_correct: Math.max(0, Math.min(7, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-orange-200 rounded px-2 py-1 text-sm"
                              min="0" max="7"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-orange-700 mb-1">Yanlış</label>
                            <input
                              type="number"
                              value={examForm.tyt_fizik_wrong}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_fizik_wrong: Math.max(0, Math.min(7, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-orange-200 rounded px-2 py-1 text-sm"
                              min="0" max="7"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-orange-600">
                          Net: {(examForm.tyt_fizik_correct - examForm.tyt_fizik_wrong / 4).toFixed(1)}
                        </div>
                      </div>

                      {/* Kimya */}
                      <div className="border rounded-lg p-4 bg-orange-50">
                        <h5 className="font-medium text-orange-800 mb-3 flex items-center">
                          🧪 Kimya (7)
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-orange-700 mb-1">Doğru</label>
                            <input
                              type="number"
                              value={examForm.tyt_kimya_correct}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_kimya_correct: Math.max(0, Math.min(7, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-orange-200 rounded px-2 py-1 text-sm"
                              min="0" max="7"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-orange-700 mb-1">Yanlış</label>
                            <input
                              type="number"
                              value={examForm.tyt_kimya_wrong}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_kimya_wrong: Math.max(0, Math.min(7, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-orange-200 rounded px-2 py-1 text-sm"
                              min="0" max="7"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-orange-600">
                          Net: {(examForm.tyt_kimya_correct - examForm.tyt_kimya_wrong / 4).toFixed(1)}
                        </div>
                      </div>

                      {/* Biyoloji */}
                      <div className="border rounded-lg p-4 bg-orange-50">
                        <h5 className="font-medium text-orange-800 mb-3 flex items-center">
                          🧬 Biyoloji (6)
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm text-orange-700 mb-1">Doğru</label>
                            <input
                              type="number"
                              value={examForm.tyt_biyoloji_correct}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_biyoloji_correct: Math.max(0, Math.min(6, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-orange-200 rounded px-2 py-1 text-sm"
                              min="0" max="6"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-orange-700 mb-1">Yanlış</label>
                            <input
                              type="number"
                              value={examForm.tyt_biyoloji_wrong}
                              onChange={(e) => setExamForm(prev => ({ ...prev, tyt_biyoloji_wrong: Math.max(0, Math.min(6, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-orange-200 rounded px-2 py-1 text-sm"
                              min="0" max="6"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-orange-600">
                          Net: {(examForm.tyt_biyoloji_correct - examForm.tyt_biyoloji_wrong / 4).toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* TYT Total */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
                      <div className="text-center">
                        <h5 className="font-bold text-indigo-800 text-lg">TYT Toplam Net</h5>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          {/* Türkçe */}
                          <div>
                            <div className="text-sm font-medium text-blue-800">Türkçe</div>
                            <div className="text-lg font-bold text-blue-600">
                              {(examForm.tyt_turkce_correct - examForm.tyt_turkce_wrong / 4).toFixed(1)}
                            </div>
                          </div>
                          
                          {/* Matematik */}
                          <div>
                            <div className="text-sm font-medium text-green-800">Matematik</div>
                            <div className="text-lg font-bold text-green-600">
                              {(
                                (examForm.tyt_matematik_correct - examForm.tyt_matematik_wrong / 4) +
                                (examForm.tyt_geometri_correct - examForm.tyt_geometri_wrong / 4)
                              ).toFixed(1)}
                            </div>
                          </div>
                          
                          {/* Sosyal */}
                          <div>
                            <div className="text-sm font-medium text-purple-800">Sosyal</div>
                            <div className="text-lg font-bold text-purple-600">
                              {(
                                (examForm.tyt_tarih_correct - examForm.tyt_tarih_wrong / 4) +
                                (examForm.tyt_cografya_correct - examForm.tyt_cografya_wrong / 4) +
                                (examForm.tyt_felsefe_correct - examForm.tyt_felsefe_wrong / 4) +
                                (examForm.tyt_din_correct - examForm.tyt_din_wrong / 4)
                              ).toFixed(1)}
                            </div>
                          </div>
                          
                          {/* Fen */}
                          <div>
                            <div className="text-sm font-medium text-orange-800">Fen</div>
                            <div className="text-lg font-bold text-orange-600">
                              {(
                                (examForm.tyt_fizik_correct - examForm.tyt_fizik_wrong / 4) +
                                (examForm.tyt_kimya_correct - examForm.tyt_kimya_wrong / 4) +
                                (examForm.tyt_biyoloji_correct - examForm.tyt_biyoloji_wrong / 4)
                              ).toFixed(1)}
                            </div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-indigo-600 mt-1">
                          {(
                            // Türkçe
                            (examForm.tyt_turkce_correct - examForm.tyt_turkce_wrong / 4) +
                            // Matematik
                            (examForm.tyt_matematik_correct - examForm.tyt_matematik_wrong / 4) +
                            (examForm.tyt_geometri_correct - examForm.tyt_geometri_wrong / 4) +
                            // Sosyal
                            (examForm.tyt_tarih_correct - examForm.tyt_tarih_wrong / 4) +
                            (examForm.tyt_cografya_correct - examForm.tyt_cografya_wrong / 4) +
                            (examForm.tyt_felsefe_correct - examForm.tyt_felsefe_wrong / 4) +
                            (examForm.tyt_din_correct - examForm.tyt_din_wrong / 4) +
                            // Fen
                            (examForm.tyt_fizik_correct - examForm.tyt_fizik_wrong / 4) +
                            (examForm.tyt_kimya_correct - examForm.tyt_kimya_wrong / 4) +
                            (examForm.tyt_biyoloji_correct - examForm.tyt_biyoloji_wrong / 4)
                          ).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AYT Scores */}
                {examModalTab === 'AYT' && (
                  <div className="mt-6 space-y-4">
                    <h4 className="font-medium text-gray-800 flex items-center">
                      📝 AYT Sınav Sonuçları
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* AYT Matematik */}
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <h5 className="font-medium text-blue-800 mb-3">🔢 Matematik (30)</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-blue-700 mb-1">Doğru</label>
                            <input
                              type="number"
                              value={examForm.ayt_matematik_correct}
                              onChange={(e) => setExamForm(prev => ({ ...prev, ayt_matematik_correct: Math.max(0, Math.min(30, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-blue-200 rounded px-2 py-1 text-sm"
                              min="0" max="30"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-blue-700 mb-1">Yanlış</label>
                            <input
                              type="number"
                              value={examForm.ayt_matematik_wrong}
                              onChange={(e) => setExamForm(prev => ({ ...prev, ayt_matematik_wrong: Math.max(0, Math.min(30, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-blue-200 rounded px-2 py-1 text-sm"
                              min="0" max="30"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-blue-600">
                          Net: {(examForm.ayt_matematik_correct - examForm.ayt_matematik_wrong / 4).toFixed(1)}
                        </div>
                      </div>

                      {/* Geometri */}
                      <div className="border rounded-lg p-4 bg-green-50">
                        <h5 className="font-medium text-green-800 mb-3">📐 Geometri (10)</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-green-700 mb-1">Doğru</label>
                            <input
                              type="number"
                              value={examForm.ayt_geometri_correct}
                              onChange={(e) => setExamForm(prev => ({ ...prev, ayt_geometri_correct: Math.max(0, Math.min(10, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-green-200 rounded px-2 py-1 text-sm"
                              min="0" max="10"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-green-700 mb-1">Yanlış</label>
                            <input
                              type="number"
                              value={examForm.ayt_geometri_wrong}
                              onChange={(e) => setExamForm(prev => ({ ...prev, ayt_geometri_wrong: Math.max(0, Math.min(10, parseInt(e.target.value) || 0)) }))}
                              className="w-full border border-green-200 rounded px-2 py-1 text-sm"
                              min="0" max="10"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-green-600">
                          Net: {(examForm.ayt_geometri_correct - examForm.ayt_geometri_wrong / 4).toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* AYT Total */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-center">
                        <h5 className="font-bold text-purple-800 text-lg">AYT Toplam Net</h5>
                        <div className="text-2xl font-bold text-purple-600 mt-1">
                          {(
                            (examForm.ayt_matematik_correct - examForm.ayt_matematik_wrong / 4) +
                            (examForm.ayt_geometri_correct - examForm.ayt_geometri_wrong / 4)
                          ).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tarama Scores */}
                {examModalTab === 'Tarama' && (
                  <div className="mt-6 space-y-4">
                    <h4 className="font-medium text-gray-800 flex items-center">
                      🔍 Tarama Sınav Sonuçları
                    </h4>

                    {/* Add New Lesson - Simplified */}
                    <div className="border rounded-lg p-4 bg-green-50">
                      <h5 className="font-medium text-green-800 mb-3 flex items-center">
                        ➕ Ders Ekle
                      </h5>
                      <div className="flex flex-col md:flex-row md:items-end gap-3">
                        <div>
                          <label className="block text-sm text-green-700 mb-1">Ders</label>
                          <select
                            value={selectedTaramaSubject}
                            onChange={e => setSelectedTaramaSubject(e.target.value)}
                            className="w-full border border-green-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Ders Seçiniz</option>
                            {['Türkçe', 'Matematik', 'Geometri', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Bilgisi', 'Fizik', 'Kimya', 'Biyoloji']
                              .filter(subject => !examForm.tarama_lessons.some(lesson => lesson.subject === subject))
                              .map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-green-700 mb-1">Soru Sayısı</label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={selectedTaramaQuestionCount}
                            onChange={e => setSelectedTaramaQuestionCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                            className="w-full border border-green-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div className="pt-5 md:pt-0">
                          <button
                            type="button"
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            disabled={!selectedTaramaSubject || !selectedTaramaQuestionCount || examForm.tarama_lessons.some(lesson => lesson.subject === selectedTaramaSubject)}
                            onClick={() => {
                              if (!selectedTaramaSubject || !selectedTaramaQuestionCount) return;
                              const newLesson = {
                                subject: selectedTaramaSubject,
                                question_count: selectedTaramaQuestionCount,
                                correct: 0,
                                wrong: 0
                              };
                              setExamForm(prev => ({
                                ...prev,
                                tarama_lessons: [...prev.tarama_lessons, newLesson]
                              }));
                              setSelectedTaramaSubject('');
                              setSelectedTaramaQuestionCount(10);
                            }}
                          >
                            Ekle
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lesson Cards - TYT Style */}
                    {examForm.tarama_lessons.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {examForm.tarama_lessons.map((lesson, index) => {
                          // Get subject icon
                          const getSubjectIcon = (subject: string) => {
                            switch(subject) {
                              case 'Türkçe': return '📘'
                              case 'Matematik': return '🔢'
                              case 'Geometri': return '📐'
                              case 'Tarih': return '📜'
                              case 'Coğrafya': return '🌍'
                              case 'Felsefe': return '🤔'
                              case 'Din Bilgisi': return '☪️'
                              case 'Fizik': return '⚡'
                              case 'Kimya': return '🧪'
                              case 'Biyoloji': return '🧬'
                              default: return '📚'
                            }
                          }

                          // Get subject color
                          const getSubjectColor = (subject: string) => {
                            switch(subject) {
                              case 'Türkçe': return 'blue'
                              case 'Matematik': return 'green'
                              case 'Geometri': return 'green'
                              case 'Tarih': return 'purple'
                              case 'Coğrafya': return 'purple'
                              case 'Felsefe': return 'purple'
                              case 'Din Bilgisi': return 'purple'
                              case 'Fizik': return 'orange'
                              case 'Kimya': return 'orange'
                              case 'Biyoloji': return 'orange'
                              default: return 'gray'
                            }
                          }

                          const color = getSubjectColor(lesson.subject)
                          
                          return (
                            <div key={index} className={`border rounded-lg p-4 bg-${color}-50 relative`}>
                              <button
                                onClick={() => {
                                  setExamForm(prev => ({
                                    ...prev,
                                    tarama_lessons: prev.tarama_lessons.filter((_, i) => i !== index)
                                  }))
                                }}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                                title="Dersi Kaldır"
                              >
                                ✕
                              </button>
                              
                              <h5 className={`font-medium text-${color}-800 mb-3 flex items-center`}>
                                {getSubjectIcon(lesson.subject)} {lesson.subject} ({lesson.question_count})
                              </h5>
                              
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <label className={`block text-sm text-${color}-700 mb-1`}>Doğru</label>
                                  <input
                                    type="number"
                                    value={lesson.correct}
                                    onChange={(e) => {
                                      const newCorrect = Math.max(0, Math.min(lesson.question_count, parseInt(e.target.value) || 0))
                                      setExamForm(prev => ({
                                        ...prev,
                                        tarama_lessons: prev.tarama_lessons.map((l, i) => 
                                          i === index ? { ...l, correct: newCorrect } : l
                                        )
                                      }))
                                    }}
                                    className={`w-full border border-${color}-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-${color}-500`}
                                    min="0"
                                    max={lesson.question_count}
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className={`block text-sm text-${color}-700 mb-1`}>Yanlış</label>
                                  <input
                                    type="number"
                                    value={lesson.wrong}
                                    onChange={(e) => {
                                      const newWrong = Math.max(0, Math.min(lesson.question_count, parseInt(e.target.value) || 0))
                                      setExamForm(prev => ({
                                        ...prev,
                                        tarama_lessons: prev.tarama_lessons.map((l, i) => 
                                          i === index ? { ...l, wrong: newWrong } : l
                                        )
                                      }))
                                    }}
                                    className={`w-full border border-${color}-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-${color}-500`}
                                    min="0"
                                    max={lesson.question_count}
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                              
                              <div className={`mt-2 text-sm text-${color}-600`}>
                                Net: {(lesson.correct - lesson.wrong / 4).toFixed(1)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Tarama Summary */}
                    {examForm.tarama_lessons.length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                        <div className="text-center">
                          <h5 className="font-bold text-green-800 text-lg mb-3">
                            Tarama Sınavı Özeti
                          </h5>
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            <div>
                              <div className="text-sm font-medium text-gray-800">Toplam Ders</div>
                              <div className="text-lg font-bold text-gray-600">
                                {examForm.tarama_lessons.length}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-blue-800">Toplam Doğru</div>
                              <div className="text-lg font-bold text-blue-600">
                                {examForm.tarama_lessons.reduce((sum, lesson) => sum + lesson.correct, 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-red-800">Toplam Yanlış</div>
                              <div className="text-lg font-bold text-red-600">
                                {examForm.tarama_lessons.reduce((sum, lesson) => sum + lesson.wrong, 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-green-800">Toplam Net</div>
                              <div className="text-2xl font-bold text-green-600">
                                {examForm.tarama_lessons.reduce((sum, lesson) => sum + (lesson.correct - lesson.wrong / 4), 0).toFixed(1)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {examForm.tarama_lessons.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📚</div>
                        <p>Henüz ders eklenmedi. Yukarıdaki dropdown'dan ders seçerek başlayın.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notlar (Opsiyonel)
                </label>
                <textarea
                  value={examForm.notes}
                  onChange={(e) => setExamForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sınav hakkında notlar..."
                  rows={3}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={closeExamModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={editingExam ? updateExamResult : createExamResult}
                disabled={!selectedStudent || !examForm.exam_name.trim() || !examForm.exam_date || 
                  (examForm.exam_type === 'Tarama' && examForm.tarama_lessons.length === 0)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingExam ? 'Sınav Sonucunu Güncelle' : 'Sınav Sonucunu Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Kullanıcı Ayarları
              </h2>
              <button
                onClick={closeSettingsModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex h-[600px]">
              {/* Settings Sidebar */}
              <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
                <nav className="space-y-2">
                  <button
                    onClick={() => setSettingsTab('profile')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                      settingsTab === 'profile'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <UserCircle className="h-4 w-4 mr-3" />
                    Profil Bilgileri
                  </button>
                  <button
                    onClick={() => setSettingsTab('security')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                      settingsTab === 'security'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Shield className="h-4 w-4 mr-3" />
                    Güvenlik
                  </button>
                  <button
                    onClick={() => setSettingsTab('appearance')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                      settingsTab === 'appearance'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Palette className="h-4 w-4 mr-3" />
                    Görünüm
                  </button>
                  <button
                    onClick={() => setSettingsTab('notifications')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                      settingsTab === 'notifications'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Bell className="h-4 w-4 mr-3" />
                    Bildirimler
                  </button>
                </nav>
              </div>

              {/* Settings Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {/* Profile Settings */}
                {settingsTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Profil Bilgileri</h3>
                      
                      {/* Avatar Section */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Profil Fotoğrafı
                        </label>
                        <div className="flex items-center space-x-4">
                          <ProfileAvatar
                            src={avatarPreview || profile?.avatar_url}
                            fallback={profile?.full_name}
                            onUpload={(file: File) => handleAvatarUpload({ target: { files: [file] } } as any)}
                            onRemove={handleRemoveAvatar}
                          />
                          <div className="text-sm text-gray-600">
                            <p>JPG, PNG veya GIF formatında</p>
                            <p>Maksimum 5MB</p>
                          </div>
                        </div>
                      </div>

                      {/* Profile Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ad Soyad
                          </label>
                          <input
                            type="text"
                            value={settingsForm.full_name}
                            onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, full_name: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ad Soyad"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            E-posta
                          </label>
                          <input
                            type="email"
                            value={settingsForm.email}
                            disabled
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500"
                            placeholder="E-posta adresi"
                          />
                          <p className="text-xs text-gray-500 mt-1">E-posta adresi değiştirilemez</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefon
                          </label>
                          <input
                            type="tel"
                            value={settingsForm.phone}
                            onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, phone: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Telefon numarası"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end mt-6">
                        <button
                          onClick={updateProfile}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Profili Güncelle
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {settingsTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Güvenlik Ayarları</h3>
                      
                      {/* Password Change */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <h4 className="font-medium text-yellow-800 mb-4 flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Şifre Değiştir
                        </h4>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mevcut Şifre
                            </label>
                            <div className="relative">
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={settingsForm.current_password}
                                onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, current_password: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Mevcut şifrenizi girin"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Yeni Şifre
                            </label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                value={settingsForm.new_password}
                                onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, new_password: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Yeni şifrenizi girin"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Yeni Şifre Tekrar
                            </label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={settingsForm.confirm_password}
                                onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, confirm_password: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Yeni şifrenizi tekrar girin"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end mt-4">
                          <button
                            onClick={updatePassword}
                            disabled={!settingsForm.current_password || !settingsForm.new_password || !settingsForm.confirm_password}
                            className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Görünüm Ayarları</h3>
                      
                      {/* Theme Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Tema Seçimi
                        </label>
                        <div className="space-y-3">
                          <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name="theme"
                              value="light"
                              checked={settingsForm.theme === 'light'}
                              onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, theme: e.target.value }))}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <Sun className="h-4 w-4 ml-3 mr-2 text-yellow-500" />
                            <span>Açık Tema</span>
                          </label>
                          
                          <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name="theme"
                              value="dark"
                              checked={settingsForm.theme === 'dark'}
                              onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, theme: e.target.value }))}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <Moon className="h-4 w-4 ml-3 mr-2 text-blue-500" />
                            <span>Koyu Tema</span>
                          </label>
                          
                          <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name="theme"
                              value="system"
                              checked={settingsForm.theme === 'system'}
                              onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, theme: e.target.value }))}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <Monitor className="h-4 w-4 ml-3 mr-2 text-gray-500" />
                            <span>Sistem Ayarı</span>
                          </label>
                        </div>
                      </div>

                      {/* Language Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Dil Seçimi
                        </label>
                        <select
                          value={settingsForm.language}
                          onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, language: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="tr">Türkçe</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={updateProfile}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Görünüm Ayarlarını Kaydet
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {settingsTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Bildirim Ayarları</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-800">Genel Bildirimler</h4>
                            <p className="text-sm text-gray-600">Sistem bildirimleri ve güncellemeler</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settingsForm.notifications_enabled}
                              onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, notifications_enabled: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-800">E-posta Bildirimleri</h4>
                            <p className="text-sm text-gray-600">Önemli güncellemeler e-posta ile gönderilsin</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settingsForm.email_notifications}
                              onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, email_notifications: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end mt-6">
                        <button
                          onClick={updateProfile}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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

             {/* Main Content with Resizable Panels */}
       <div className="h-[calc(100vh-4rem)]">
         <ResizablePanelGroup direction="horizontal" className="h-full">
                     {/* Left Panel - Weekly Plan */}
          <ResizablePanel defaultSize={75} minSize={30} className="bg-white h-full">
          <div className="p-4 h-full flex flex-col min-h-0">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4 bg-white rounded-lg p-3 shadow-sm border border-blue-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <span>Haftalık Program</span>
                </h2>
                
                <button
                  onClick={() => navigateWeek('next')}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                  <span className="font-medium">{formatDate(weekDates[0])} - {formatDate(weekDates[6])}</span>
                </div>
                
                {/* Real-time connection status */}
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`${realtimeConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {realtimeConnected ? 'Canlı' : 'Çevrimdışı'}
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Calendar Grid - Responsive Layout */}
            <div 
              ref={calendarContainerRef}
              className="flex-1 bg-slate-100 p-3 rounded-lg min-h-0 overflow-y-auto"
            >
              <div 
                ref={gridContainerRef}
                className="h-fit gap-3"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`
                }}
              >

                {weekDates.map((date, index) => {
                  const dayTasks = getTasksForDay(date)
                  const completedTasks = dayTasks.filter(t => t.status === 'completed').length
                  const totalTasks = dayTasks.length
                  
                  return (
                    <div key={index} className="day-card flex flex-col bg-white rounded-xl shadow-md border border-gray-300 hover:shadow-xl transition-all duration-200 overflow-hidden">
                      {/* Day Header - New Clean Design */}
                      <div className="day-header bg-gradient-to-br from-slate-50 to-gray-100 border-b border-gray-200">
                        {/* Top row: Date | Day Name | Plus Button */}
                        <div className="flex items-center justify-between px-3 py-2">
                          {/* Left: Date */}
                          <div className="text-xs text-slate-500 font-medium">
                            {formatDate(date)}
                          </div>
                          
                          {/* Center: Day Name */}
                          <div className="text-sm font-semibold text-slate-700">
                            {dayNames[index]}
                          </div>
                          
                          {/* Right: Add Task Button - Only show for coaches and coordinators */}
                          {(userRole === 'coach' || userRole === 'coordinator') && (
                            <button
                              disabled={!selectedStudent}
                              onClick={() => openTaskModal(date)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-full transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Görev Ekle"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        
                        {/* Bottom row: Completion status centered */}
                        <div className="flex justify-center pb-2">
                          <div className="text-xs">
                            {totalTasks > 0 ? (
                              <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-sm">
                                {completedTasks}/{totalTasks}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">Görev yok</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Day Content - More space for tasks */}
                      <div className="space-y-2.5 p-3 min-h-0 overflow-y-auto">
                        
                        {/* Task Cards */}
                        {dayTasks.map((task) => {
                          const subject = subjects.find(s => s.id === task.subject_id)
                          const topic = topics.find(t => t.id === task.topic_id)
                          const resource = resources.find(r => r.id === task.resource_id)
                          const mockExam = mockExams.find(m => m.id === task.mock_exam_id)
                          
                          // Define task type colors and styles - Improved Completion Design
                          const getTaskTypeStyle = (taskType: string, isCompleted: boolean) => {
                            const baseStyle = "p-3 border-l-4 rounded-lg transition-all hover:shadow-md cursor-pointer border border-gray-200"
                            
                            if (isCompleted) {
                              // Completed tasks: Gray background with green accent and checkmark pattern
                              return `${baseStyle} border-l-green-500 bg-gray-100 opacity-90 border-gray-300 relative`
                            }
                            
                            switch (taskType) {
                              case 'study':
                                return `${baseStyle} border-l-blue-500 bg-blue-50 hover:bg-blue-100 hover:border-blue-300`
                              case 'practice':
                                return `${baseStyle} border-l-orange-500 bg-orange-50 hover:bg-orange-100 hover:border-orange-300`
                              case 'exam':
                                return `${baseStyle} border-l-red-500 bg-red-50 hover:bg-red-100 hover:border-red-300`
                              case 'review':
                                return `${baseStyle} border-l-purple-500 bg-purple-50 hover:bg-purple-100 hover:border-purple-300`
                              case 'resource':
                                return `${baseStyle} border-l-indigo-500 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300`
                              case 'coaching_session':
                                return `${baseStyle} border-l-emerald-500 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300`
                              default:
                                return `${baseStyle} border-l-gray-500 bg-gray-50 hover:bg-gray-100 hover:border-gray-300`
                            }
                          }
                          
                          // Check if user can update this task
                          const canUpdate = userRole === 'coach' || userRole === 'coordinator' || (userRole === 'student' && user?.id === task.assigned_to)
                          
                          return (
                            <div 
                              key={task.id} 
                              onClick={() => handleTaskClick(task)}
                              className={`task-card group ${getTaskTypeStyle(task.task_type, task.status === 'completed')} ${canUpdate ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                              title={canUpdate ? 'Görevi tamamlandı olarak işaretle' : 'Bu görevi tamamlama yetkiniz yok'}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center space-x-1">
                                  {task.task_type === 'study' && <BookOpen className="h-3 w-3 text-blue-600" />}
                                  {task.task_type === 'practice' && <Calculator className="h-3 w-3 text-orange-600" />}
                                  {task.task_type === 'exam' && <FileText className="h-3 w-3 text-red-600" />}
                                  {task.task_type === 'review' && <BarChart3 className="h-3 w-3 text-purple-600" />}
                                  {task.task_type === 'resource' && <Link className="h-3 w-3 text-indigo-600" />}
                                  {task.task_type === 'coaching_session' && <Video className="h-3 w-3 text-emerald-600" />}
                                  <span className="text-xs font-semibold text-gray-700">
                                    {task.task_type === 'study' ? 'ÇALIŞMA' :
                                     task.task_type === 'practice' ? 'SORU ÇÖZ' :
                                     task.task_type === 'exam' ? 'SINAV' :
                                     task.task_type === 'resource' ? 'KAYNAK' :
                                     task.task_type === 'coaching_session' ? 'KOÇLUK SEANSI' : 'TEKRAR'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {/* Edit and Delete Buttons - Only show for coaches and coordinators */}
                                  {(userRole === 'coach' || userRole === 'coordinator') && (
                                    <>
                                      {/* Edit Button */}
                                      <button
                                        onClick={(e) => openEditModal(task, e)}
                                        className="p-1 hover:bg-white hover:bg-opacity-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Düzenle"
                                      >
                                        <Edit className="h-3 w-3 text-gray-600 hover:text-blue-600" />
                                      </button>
                                      {/* Delete Button */}
                                      <button
                                        onClick={(e) => deleteTask(task, e)}
                                        className="p-1 hover:bg-white hover:bg-opacity-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Sil"
                                      >
                                        <Trash2 className="h-3 w-3 text-gray-600 hover:text-red-600" />
                                      </button>
                                    </>
                                  )}
                                  {/* Completion Status */}
                                  {updatingTaskId === task.id ? (
                                    <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                  ) : task.status === 'completed' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <div className="h-4 w-4 border-2 border-gray-400 rounded-full hover:border-gray-600 transition-colors"></div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Show resource, subject-topic-mockexam, or custom title */}
                              {resource ? (
                                <div className="text-xs text-indigo-700 mb-1 font-medium">
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.open(resource.url, '_blank')
                                    }}
                                    className="cursor-pointer hover:underline"
                                  >
                                    {resource.name}
                                  </span>
                                  <span className="text-gray-600 ml-1">({resource.category.toUpperCase()})</span>
                                </div>
                              ) : (subject || topic || mockExam) ? (
                                <div className="text-xs text-gray-700 mb-1 font-medium">
                                  {/* Show subject and topic */}
                                  {subject && topic ? `${subject.name} - ${topic.name}` :
                                   subject ? subject.name :
                                   topic ? topic.name : ''}
                                  {/* Show mock exam for practice/exam tasks */}
                                  {mockExam && (task.task_type === 'practice' || task.task_type === 'exam') && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      📝 {mockExam.name}
                                    </div>
                                  )}
                                </div>
                              ) : task.title !== 'Görev' && (
                                <div className={`text-xs font-medium mb-1 line-clamp-2 ${
                                  task.status === 'completed' ? 'text-gray-600 line-through' : 'text-gray-800'
                                }`}>
                                  {task.title}
                                </div>
                              )}

                              {/* Show task description if it exists and is not empty */}
                              {task.description && task.description.trim() && (
                                <div className={`text-xs mb-1 line-clamp-2 ${
                                  task.status === 'completed' ? 'text-gray-500' : 'text-gray-600'
                                }`}>
                                  {task.description}
                                </div>
                              )}
                              
                              {/* Problem count on separate line if exists */}
                              {task.task_type === 'practice' && task.problem_count && (
                                <div className="flex items-center space-x-1 text-xs text-orange-700 mb-1 font-medium">
                                  <Calculator className="h-3 w-3" />
                                  <span>{task.problem_count} soru</span>
                                </div>
                              )}
                              
                              {/* Time and duration at the bottom */}
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="font-medium">
                                    {task.scheduled_start_time ? task.scheduled_start_time.substring(0, 5) : '--:--'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Timer className="h-3 w-3" />
                                  <span className="font-medium">{task.estimated_duration}dk</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Tabbed Interface */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={70} className="bg-white">
          <div className="h-full flex flex-col pb-6">
            {/* Tab Headers */}
            <div className="border-b">
              <div className="flex">
                {                [
                  { id: 'statistics', label: 'Gelişimim', icon: BarChart3 },
                  { id: 'profile', label: 'Bilgilerim', icon: User },
                  { id: 'chat', label: 'Chat', icon: MessageCircle },
                  { id: 'video', label: 'Video', icon: Video },
                  { id: 'exams', label: 'Sınavlar', icon: Trophy },
                  { id: 'tools', label: 'Araçlar', icon: Settings }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-2 py-3 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="h-3 w-3 mx-auto mb-1" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {activeTab === 'statistics' && (
                <div className="space-y-6 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      📊 Gelişim İstatistikleri
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${!showMonthlyStats ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Haftalık</span>
                      <button
                        onClick={() => setShowMonthlyStats(!showMonthlyStats)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showMonthlyStats ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            showMonthlyStats ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`text-sm ${showMonthlyStats ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Aylık</span>
                    </div>
                  </div>
                  {selectedStudent ? (
                    <div className="space-y-6">
                      {/* Progress Overview Cards */}
                      <div className="grid grid-cols-1 gap-4">
                        {/* Completion Rate Card */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium text-green-800">
                              {showMonthlyStats ? 'Bu Ay' : 'Bu Hafta'} Tamamlanan
                            </div>
                            <div className="text-green-600">✓</div>
                          </div>
                          <div className="text-3xl font-bold text-green-700 mb-2">
                            {Math.round((weeklyTasks.filter(t => {
                              const taskDate = new Date(t.scheduled_date);
                              if (showMonthlyStats) {
                                const monthStart = new Date(currentWeek);
                                monthStart.setDate(1);
                                const monthEnd = new Date(monthStart);
                                monthEnd.setMonth(monthStart.getMonth() + 1);
                                monthEnd.setDate(0);
                                return taskDate >= monthStart && taskDate <= monthEnd && t.status === 'completed';
                              } else {
                                const weekStart = getWeekStart(currentWeek);
                                const weekEnd = new Date(weekStart);
                                weekEnd.setDate(weekStart.getDate() + 6);
                                return taskDate >= weekStart && taskDate <= weekEnd && t.status === 'completed';
                              }
                            }).length / Math.max(weeklyTasks.length, 1)) * 100)}%
                          </div>
                          <div className="text-xs text-green-600 mb-3">
                            {weeklyTasks.filter(t => {
                              const taskDate = new Date(t.scheduled_date);
                              if (showMonthlyStats) {
                                const monthStart = new Date(currentWeek);
                                monthStart.setDate(1);
                                const monthEnd = new Date(monthStart);
                                monthEnd.setMonth(monthStart.getMonth() + 1);
                                monthEnd.setDate(0);
                                return taskDate >= monthStart && taskDate <= monthEnd && t.status === 'completed';
                              } else {
                                const weekStart = getWeekStart(currentWeek);
                                const weekEnd = new Date(weekStart);
                                weekEnd.setDate(weekStart.getDate() + 6);
                                return taskDate >= weekStart && taskDate <= weekEnd && t.status === 'completed';
                              }
                            }).length}/{weeklyTasks.length} görev
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-green-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.round((weeklyTasks.filter(t => {
                                  const taskDate = new Date(t.scheduled_date);
                                  if (showMonthlyStats) {
                                    const monthStart = new Date(currentWeek);
                                    monthStart.setDate(1);
                                    const monthEnd = new Date(monthStart);
                                    monthEnd.setMonth(monthStart.getMonth() + 1);
                                    monthEnd.setDate(0);
                                    return taskDate >= monthStart && taskDate <= monthEnd && t.status === 'completed';
                                  } else {
                                    const weekStart = getWeekStart(currentWeek);
                                    const weekEnd = new Date(weekStart);
                                    weekEnd.setDate(weekStart.getDate() + 6);
                                    return taskDate >= weekStart && taskDate <= weekEnd && t.status === 'completed';
                                  }
                                }).length / Math.max(weeklyTasks.length, 1)) * 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Study Hours Card */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-blue-800">
                  Toplam Çalışma Saati
                </div>
                <div className="text-blue-600">⏰</div>
              </div>
              <div className="text-3xl font-bold text-blue-700 mb-2">
                {(() => {
                  if (showMonthlyStats) {
                    const monthStart = new Date(currentWeek)
                    monthStart.setDate(1)
                    const monthEnd = new Date(monthStart)
                    monthEnd.setMonth(monthStart.getMonth() + 1)
                    monthEnd.setDate(0)
                    return Math.round(weeklyTasks.filter(t => {
                      const taskDate = new Date(t.scheduled_date)
                      return taskDate >= monthStart && taskDate <= monthEnd && t.status === 'completed'
                    }).reduce((acc, t) => acc + t.estimated_duration, 0) / 60 * 10) / 10
                  } else {
                    return Math.round(weeklyTasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.estimated_duration, 0) / 60 * 10) / 10
                  }
                })()}h
              </div>
              <div className="text-xs text-blue-600 mb-3">
                {showMonthlyStats ? 'Bu ay toplam' : 'Bu hafta tahmini'}
              </div>
              {/* Study Hours Visualization */}
              <div className="flex items-end space-x-1 h-8">
                {(() => {
                  if (showMonthlyStats) {
                    const monthStart = new Date(currentWeek)
                    monthStart.setDate(1)
                    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
                    return Array.from({length: daysInMonth}, (_, i) => {
                      const dayDate = new Date(monthStart)
                      dayDate.setDate(i + 1)
                      const dayTasks = weeklyTasks.filter(t => {
                        const taskDate = new Date(t.scheduled_date)
                        return taskDate.toDateString() === dayDate.toDateString() && t.status === 'completed'
                      })
                      const dayHours = dayTasks.reduce((acc, t) => acc + t.estimated_duration, 0) / 60
                      const maxHeight = Math.max(dayHours / 8, 0.1) // Max 8 hours scale
                      return (
                        <div 
                          key={i}
                          className="bg-blue-400 rounded-sm flex-1 transition-all duration-300"
                          style={{ height: `${Math.min(maxHeight * 100, 100)}%` }}
                          title={`${dayDate.getDate()} - ${dayHours.toFixed(1)} saat`}
                        ></div>
                      )
                    })
                  } else {
                    return [1,2,3,4,5,6,7].map((day, index) => {
                      const dayTasks = weeklyTasks.filter(t => {
                        const taskDate = new Date(t.scheduled_date)
                        const weekStart = getWeekStart(currentWeek)
                        const dayDate = new Date(weekStart)
                        dayDate.setDate(weekStart.getDate() + index)
                        return taskDate.toDateString() === dayDate.toDateString() && t.status === 'completed'
                      })
                      const dayHours = dayTasks.reduce((acc, t) => acc + t.estimated_duration, 0) / 60
                      const maxHeight = Math.max(dayHours / 8, 0.1) // Max 8 hours scale
                      return (
                        <div 
                          key={index}
                          className="bg-blue-400 rounded-sm flex-1 transition-all duration-300"
                          style={{ height: `${Math.min(maxHeight * 100, 100)}%` }}
                          title={`${dayHours.toFixed(1)} saat`}
                        ></div>
                      )
                    })
                  }
                })()}
              </div>
            </div>

                        {/* Monthly/Weekly Question Stats */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium text-blue-800">
                              {showMonthlyStats ? 'Aylık' : 'Haftalık'} Çözülen Soru Miktarı
                            </div>
                            <div className="text-blue-600">📚</div>
                          </div>
                          <div className="space-y-4">
                            {(showMonthlyStats ? calculateMonthlyStats() : calculateWeeklyStats()).map((stat, index) => (
                              <div key={index} className="flex items-center">
                                <div className="w-24 text-xs text-blue-700 font-medium">
                                  {stat.subject}
                                </div>
                                <div className="flex-1 mx-3">
                                  <div className="w-full bg-blue-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                      style={{ 
                                        width: `${Math.min((stat.totalProblems / Math.max(...(showMonthlyStats ? calculateMonthlyStats() : calculateWeeklyStats()).map(s => s.totalProblems))) * 100, 100)}%` 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="text-xs text-blue-600 w-16 text-right">
                                  {stat.totalProblems} soru
                                </div>
                              </div>
                            ))}
                            {(showMonthlyStats ? calculateMonthlyStats() : calculateWeeklyStats()).length === 0 && (
                              <div className="text-center py-4 text-gray-500">
                                <p>Henüz soru çözülmemiş.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Task Type Distribution - Only show in weekly view */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                          <div className="text-sm font-medium text-purple-800 mb-4 flex items-center">
                            📈 Görev Türü Dağılımı
                          </div>
                          <div className="space-y-3">
                            {(() => {
                              const taskTypes = ['study', 'practice', 'exam', 'review', 'resource', 'coaching_session']
                              const taskTypeNames: Record<string, string> = {
                                'study': 'Çalışma',
                                'practice': 'Soru Çöz',
                                'exam': 'Sınav',
                                'review': 'Tekrar',
                                'resource': 'Kaynak',
                                'coaching_session': 'Koçluk Seansı'
                              }
                              const taskTypeColors: Record<string, string> = {
                                'study': 'bg-blue-500',
                                'practice': 'bg-green-500',
                                'exam': 'bg-red-500',
                                'review': 'bg-yellow-500',
                                'resource': 'bg-indigo-500',
                                'coaching_session': 'bg-purple-500'
                              }
                              
                              const filteredTasks = weeklyTasks.filter(t => {
                                if (showMonthlyStats) {
                                  const taskDate = new Date(t.scheduled_date)
                                  const monthStart = new Date(currentWeek)
                                  monthStart.setDate(1)
                                  const monthEnd = new Date(monthStart)
                                  monthEnd.setMonth(monthStart.getMonth() + 1)
                                  monthEnd.setDate(0)
                                  return taskDate >= monthStart && taskDate <= monthEnd
                                } else {
                                  const taskDate = new Date(t.scheduled_date)
                                  const weekStart = getWeekStart(currentWeek)
                                  const weekEnd = new Date(weekStart)
                                  weekEnd.setDate(weekStart.getDate() + 6)
                                  return taskDate >= weekStart && taskDate <= weekEnd
                                }
                              })
                              
                              return taskTypes.map(type => {
                                const count = filteredTasks.filter(t => t.task_type === type).length
                                const percentage = filteredTasks.length > 0 ? (count / filteredTasks.length) * 100 : 0
                                
                                if (count === 0) return null
                                
                                return (
                                  <div key={type} className="flex items-center">
                                    <div className="w-16 text-xs text-purple-700 font-medium">
                                      {taskTypeNames[type]}
                                    </div>
                                    <div className="flex-1 mx-3">
                                      <div className="w-full bg-purple-200 rounded-full h-2">
                                        <div 
                                          className={`${taskTypeColors[type]} h-2 rounded-full transition-all duration-500`}
                                          style={{ width: `${percentage}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div className="text-xs text-purple-600 w-12 text-right">
                                      {count} ({Math.round(percentage)}%)
                                    </div>
                                  </div>
                                )
                              }).filter(Boolean)
                            })()}
                          </div>
                        </div>

                      {/* Performance Chart */}
                        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                          <div className="text-sm font-medium text-orange-800 mb-4 flex items-center">
                            📅 {showMonthlyStats ? 'Aylık' : 'Haftalık'} Performans
                          </div>
                          {showMonthlyStats ? (
                            <>
                              <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, index) => (
                                  <div key={index} className="text-xs text-center text-orange-600 font-medium">
                                    {day}
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 gap-1">
                                {(() => {
                                  const monthStart = new Date(currentWeek)
                                  monthStart.setDate(1)
                                  const firstDay = monthStart.getDay() || 7 // Convert Sunday (0) to 7
                                  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
                                  
                                  // Add empty cells for days before the first of the month
                                  const emptyCells = Array(firstDay - 1).fill(null)
                                  
                                  // Create array for all days in the month
                                  const days = Array.from({length: daysInMonth}, (_, i) => {
                                    const dayDate = new Date(monthStart)
                                    dayDate.setDate(i + 1)
                                    return dayDate
                                  })
                                  
                                  // Combine empty cells and days
                                  const allCells = [...emptyCells, ...days]
                                  
                                  return allCells.map((date, index) => {
                                    if (!date) {
                                      return <div key={`empty-${index}`} className="aspect-square" />
                                    }
                                    
                                    const dayTasks = weeklyTasks.filter(t => {
                                      const taskDate = new Date(t.scheduled_date)
                                      return taskDate.toDateString() === date.toDateString()
                                    })
                                    
                                    const completedTasks = dayTasks.filter(t => t.status === 'completed').length
                                    const totalTasks = dayTasks.length
                                    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
                                    
                                    let bgColor = 'bg-gray-200'
                                    if (completionRate >= 80) bgColor = 'bg-green-500'
                                    else if (completionRate >= 60) bgColor = 'bg-yellow-500'
                                    else if (completionRate >= 40) bgColor = 'bg-orange-500'
                                    else if (completionRate > 0) bgColor = 'bg-red-400'
                                    
                                    return (
                                      <div key={date.getTime()} className="aspect-square">
                                        <div 
                                          className={`w-full h-full rounded ${bgColor} flex items-center justify-center transition-all duration-300`}
                                          title={`${date.getDate()} - ${completedTasks}/${totalTasks} görev (${Math.round(completionRate)}%)`}
                                        >
                                          <span className="text-[10px] text-white font-bold">
                                            {date.getDate()}
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })
                                })()}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, index) => (
                                  <div key={index} className="text-xs text-center text-orange-600 font-medium">
                                    {day}
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 gap-1">
                                {[0,1,2,3,4,5,6].map((dayIndex) => {
                                  const weekStart = getWeekStart(currentWeek)
                                  const dayDate = new Date(weekStart)
                                  dayDate.setDate(weekStart.getDate() + dayIndex)
                                  
                                  const dayTasks = weeklyTasks.filter(t => {
                                    const taskDate = new Date(t.scheduled_date)
                                    return taskDate.toDateString() === dayDate.toDateString()
                                  })
                                  
                                  const completedTasks = dayTasks.filter(t => t.status === 'completed').length
                                  const totalTasks = dayTasks.length
                                  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
                                  
                                  let bgColor = 'bg-gray-200'
                                  if (completionRate >= 80) bgColor = 'bg-green-500'
                                  else if (completionRate >= 60) bgColor = 'bg-yellow-500'
                                  else if (completionRate >= 40) bgColor = 'bg-orange-500'
                                  else if (completionRate > 0) bgColor = 'bg-red-400'
                                  
                                  return (
                                    <div key={dayIndex} className="aspect-square">
                                      <div 
                                        className={`w-full h-full rounded ${bgColor} flex items-center justify-center transition-all duration-300`}
                                        title={`${completedTasks}/${totalTasks} görev (${Math.round(completionRate)}%)`}
                                      >
                                        <span className="text-xs text-white font-bold">
                                          {totalTasks > 0 ? Math.round(completionRate) : ''}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </>
                          )}
                          <div className="mt-3 flex items-center justify-center space-x-4 text-xs">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                              <span className="text-orange-600">Mükemmel (80%+)</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
                              <span className="text-orange-600">İyi (60%+)</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-orange-500 rounded mr-1"></div>
                              <span className="text-orange-600">Orta (40%+)</span>
                            </div>
                          </div>
                        </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📊</div>
                      <p className="text-sm text-gray-500">
                        Gelişim istatistikleri için bir öğrenci seçin.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-900">Mesajlaşma</h3>
                  {userRole === 'coordinator' ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        💬 Koordinatör olarak doğrudan mesajlaşma özelliği kullanılamaz.
                      </p>
                    </div>
                  ) : userRole === 'coach' ? (
                    selectedStudent ? (
                      <div className="h-[calc(100vh-12rem)]">
                        <StreamChat 
                          partnerId={selectedStudent.id}
                          partnerName={selectedStudent.full_name}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Mesajlaşmak için bir öğrenci seçin.
                      </p>
                    )
                  ) : (
                    assignedCoach ? (
                      <div className="h-[calc(100vh-12rem)]">
                        <StreamChat 
                          partnerId={assignedCoach.id}
                          partnerName={assignedCoach.full_name}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Koç ataması yapılmamış.
                      </p>
                    )
                  )}
                </div>
              )}

              {activeTab === 'video' && (
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold text-gray-900">Video Görüşme</h3>
                  {userRole === 'coordinator' ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        📹 Koordinatör olarak doğrudan video görüşme özelliği kullanılamaz.
                      </p>
                    </div>
                  ) : userRole === 'coach' ? (
                    selectedStudent ? (
                      <div className="h-[calc(100vh-12rem)]">
                        <StreamVideo 
                          partnerId={selectedStudent.id}
                          partnerName={selectedStudent.full_name}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Video görüşme için bir öğrenci seçin.
                      </p>
                    )
                  ) : (
                    assignedCoach ? (
                      <div className="h-[calc(100vh-12rem)]">
                        <StreamVideo 
                          partnerId={assignedCoach.id}
                          partnerName={assignedCoach.full_name}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Koç ataması yapılmamış.
                      </p>
                    )
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="space-y-6 mb-6">
                  {selectedStudent ? (
                    <>
                      {/* Student Profile Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            👤 Bilgilerim
                          </h3>
                          <button
                            onClick={saveProfile}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            💾 Kaydet
                          </button>
                        </div>
                        
                        {/* Profile Form - Always Visible */}
                        <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Read-only username */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Kullanıcı Adı (Salt okunur)
                                </label>
                                <input
                                  type="text"
                                  value={selectedStudent.email.split('@')[0]}
                                  disabled
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                                />
                              </div>

                              {/* Full Name */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Tam Adı *
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.full_name}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                              </div>

                              {/* Email */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Email *
                                </label>
                                <input
                                  type="email"
                                  value={profileForm.email}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                />
                              </div>

                              {/* Phone */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Telefon
                                </label>
                                <input
                                  type="tel"
                                  value={profileForm.phone}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="5551234567"
                                />
                              </div>

                              {/* Department */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Bölüm
                                </label>
                                <select
                                  value={profileForm.department}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Seçiniz...</option>
                                  <option value="Sayısal">Sayısal</option>
                                  <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                                  <option value="Sözel">Sözel</option>
                                  <option value="Dil">Dil</option>
                                </select>
                              </div>

                              {/* School */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Okul
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.school}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, school: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Okul adı"
                                />
                              </div>

                              {/* Tutoring Center */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Dershane
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.tutoring_center}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, tutoring_center: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Dershane adı"
                                />
                              </div>

                              {/* Target University */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Hedef Üniversite
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.target_university}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, target_university: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Hedef üniversite"
                                />
                              </div>

                              {/* Target Department */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Hedef Bölüm
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.target_department}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, target_department: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Hedef bölüm"
                                />
                              </div>

                              {/* YKS Score */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  YKS Puanı
                                </label>
                                <input
                                  type="number"
                                  value={profileForm.yks_score}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, yks_score: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="YKS puanı"
                                  min="0"
                                  max="600"
                                />
                              </div>

                              {/* Start Date */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Başlama Tarihi
                                </label>
                                <input
                                  type="date"
                                  value={profileForm.start_date}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, start_date: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              {/* Parent Name */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Veli Adı
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.parent_name}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, parent_name: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Veli adı"
                                />
                              </div>

                              {/* Parent Phone */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Veli Telefonu
                                </label>
                                <input
                                  type="tel"
                                  value={profileForm.parent_phone}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, parent_phone: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Veli telefonu"
                                />
                              </div>
                            </div>

                            {/* Address (full width) */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Adres
                              </label>
                              <textarea
                                value={profileForm.address}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Adres bilgileri"
                                rows={2}
                              />
                            </div>

                            {/* Notes (full width) */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notlar
                              </label>
                              <textarea
                                value={profileForm.notes}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Öğrenci hakkında notlar"
                                rows={3}
                              />
                            </div>

                          </div>
                      </div>

                      {/* Goals Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            🎯 Hedefler
                          </h3>
                          <button
                            onClick={openGoalModal}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            + Hedef Ekle
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {goals.length > 0 ? goals.map((goal) => (
                            <div key={goal.id} className="border rounded-lg p-4 bg-white">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm font-medium text-gray-800">
                                      {goal.title}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {goal.priority === 'high' ? 'Yüksek' : 
                                       goal.priority === 'medium' ? 'Orta' : 'Düşük'}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      goal.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                      goal.status === 'paused' ? 'bg-gray-100 text-gray-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {goal.status === 'completed' ? 'Tamamlandı' :
                                       goal.status === 'active' ? 'Aktif' :
                                       goal.status === 'paused' ? 'Duraklatıldı' : 'İptal'}
                                    </span>
                                  </div>
                                  {goal.description && (
                                    <div className="text-sm text-gray-600 mb-2">
                                      {goal.description}
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    {goal.target_value && (
                                      <span>🎯 Hedef: {goal.target_value}</span>
                                    )}
                                    {goal.current_value && (
                                      <span>📊 Mevcut: {goal.current_value}</span>
                                    )}
                                    {goal.target_date && (
                                      <span>📅 Tarih: {new Date(goal.target_date).toLocaleDateString('tr-TR')}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => openEditGoalModal(goal)}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Düzenle"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteGoal(goal)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Sil"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Progress Bar for goals with both target and current values */}
                              {goal.target_value && goal.current_value && (
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>İlerleme</span>
                                    <span>
                                      {(() => {
                                        const target = parseFloat(goal.target_value) || 1
                                        const current = parseFloat(goal.current_value) || 0
                                        return Math.round((current / target) * 100)
                                      })()}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${Math.min(
                                          ((parseFloat(goal.current_value || '0') / parseFloat(goal.target_value || '1')) * 100),
                                          100
                                        )}%`
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )) : (
                            <div className="text-center py-8 border rounded-lg bg-gray-50">
                              <div className="text-4xl mb-2">🎯</div>
                              <p className="text-sm text-gray-500">
                                Henüz hedef eklenmemiş. Öğrenci için hedef ekleyebilirsiniz.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">👤</div>
                      <p className="text-sm text-gray-500">
                        Bilgileri görmek için bir öğrenci seçin.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'exams' && (
                <div className="space-y-6 mb-6">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    🏆 Sınav Sonuçları
                  </h3>
                  
                  {selectedStudent ? (
                    <>
                      {/* Exam Results Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-800 flex items-center">
                            📝 Deneme Sınavı Sonuçları
                          </h4>
                          <button
                            onClick={openExamModal}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            + Sınav Sonucu Ekle
                          </button>
                        </div>
                        
                        {mockExamResults.length > 0 ? (
                          <div className="space-y-3">
                            {mockExamResults.map((result) => (
                              <div key={result.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                        result.exam_type === 'TYT' 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : result.exam_type === 'AYT'
                                          ? 'bg-purple-100 text-purple-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {result.exam_type}
                                      </span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {result.exam_name}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(result.exam_date).toLocaleDateString('tr-TR')}
                                      </span>
                                    </div>
                                    
                                    {/* Net Scores Display */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                                      {result.exam_type === 'TYT' ? (
                                        <>
                                          {/* Türkçe */}
                                          <div className="bg-blue-50 rounded p-2">
                                            <div className="font-medium text-blue-800">Türkçe</div>
                                            <div className="text-blue-600">{result.tyt_turkce_net?.toFixed(1) || '0.0'} net</div>
                                          </div>
                                          
                                          {/* Matematik Group */}
                                          <div className="bg-green-50 rounded p-2">
                                            <div className="font-medium text-green-800">Matematik</div>
                                            <div className="text-green-600">{(
                                              (result.tyt_matematik_net || 0) + 
                                              (result.tyt_geometri_net || 0)
                                            ).toFixed(1)} net</div>
                                          </div>
                                          
                                          {/* Sosyal Group */}
                                          <div className="bg-purple-50 rounded p-2">
                                            <div className="font-medium text-purple-800">Sosyal Bilimler</div>
                                            <div className="text-purple-600">{(
                                              (result.tyt_tarih_net || 0) + 
                                              (result.tyt_cografya_net || 0) + 
                                              (result.tyt_felsefe_net || 0) + 
                                              (result.tyt_din_net || 0)
                                            ).toFixed(1)} net</div>
                                          </div>
                                          
                                          {/* Fen Group */}
                                          <div className="bg-orange-50 rounded p-2">
                                            <div className="font-medium text-orange-800">Fen Bilimleri</div>
                                            <div className="text-orange-600">{(
                                              (result.tyt_fizik_net || 0) + 
                                              (result.tyt_kimya_net || 0) + 
                                              (result.tyt_biyoloji_net || 0)
                                            ).toFixed(1)} net</div>
                                          </div>
                                        </>
                                      ) : result.exam_type === 'AYT' ? (
                                        <>
                                          <div className="bg-blue-50 rounded p-2">
                                            <div className="font-medium text-blue-800">Matematik (30)</div>
                                            <div className="text-blue-600">{result.ayt_matematik_net?.toFixed(1) || '0.0'} net</div>
                                          </div>
                                          <div className="bg-green-50 rounded p-2">
                                            <div className="font-medium text-green-800">Geometri (10)</div>
                                            <div className="text-green-600">{result.ayt_geometri_net?.toFixed(1) || '0.0'} net</div>
                                          </div>
                                          <div className="bg-purple-50 rounded p-2 col-span-2">
                                            <div className="font-medium text-purple-800">Toplam</div>
                                            <div className="text-purple-600">{result.ayt_total_net?.toFixed(1) || '0.0'} net</div>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          {/* Tarama - Subject and Question Count */}
                                          {result.tarama_lessons && result.tarama_lessons.length > 0 ? (
                                            result.tarama_lessons.map((lesson, index) => (
                                              <div key={index} className="bg-green-50 rounded p-2 col-span-2 md:col-span-1">
                                                <div className="font-medium text-green-800">{lesson.subject}</div>
                                                <div className="text-xs text-gray-600">{lesson.question_count} soru</div>
                                                <div className="text-green-600">{lesson.net.toFixed(1)} net</div>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="col-span-2 md:col-span-4 bg-gray-50 rounded p-2 text-center">
                                              <div className="text-gray-500 text-xs">Tarama ders bilgisi bulunamadı</div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    
                                    {/* Total Net Score */}
                                    <div className="mt-3 p-2 bg-gradient-to-r from-indigo-50 to-blue-50 rounded">
                                      <div className="text-sm font-medium text-indigo-800">
                                        Toplam Net: {
                                          result.exam_type === 'TYT' ? result.tyt_total_net?.toFixed(1) 
                                          : result.exam_type === 'AYT' ? result.ayt_total_net?.toFixed(1)
                                          : result.tarama_total_net?.toFixed(1) || 
                                            (result.tarama_lessons?.reduce((sum, lesson) => sum + lesson.net, 0).toFixed(1)) || '0.0'
                                        }
                                      </div>
                                    </div>
                                    
                                    {result.notes && (
                                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                                        💬 {result.notes}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => openEditExamModal(result)}
                                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Düzenle"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteExamResult(result)}
                                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                      title="Sil"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border rounded-lg p-6 bg-gradient-to-r from-yellow-50 to-orange-50 text-center">
                            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                            <h5 className="font-medium text-gray-900 mb-2">Henüz Sınav Sonucu Yok</h5>
                            <p className="text-sm text-gray-600 mb-4">
                              {selectedStudent.full_name} için TYT, AYT veya Tarama deneme sınav sonuçlarını buraya ekleyebilirsiniz.
                            </p>
                            <button
                              onClick={openExamModal}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              İlk Sınav Sonucunu Ekle
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Exam Statistics Section */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                          📊 Sınav İstatistikleri
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* TYT Average */}
                          <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-700 mb-1">
                                {mockExamResults.filter(r => r.exam_type === 'TYT').length > 0 
                                  ? (mockExamResults
                                      .filter(r => r.exam_type === 'TYT')
                                      .reduce((acc, r) => acc + (r.tyt_total_net || 0), 0) / 
                                      mockExamResults.filter(r => r.exam_type === 'TYT').length
                                    ).toFixed(1)
                                  : '0.0'
                                }
                              </div>
                              <div className="text-sm font-medium text-blue-800">TYT Ortalama Net</div>
                              <div className="text-xs text-blue-600 mt-1">
                                {mockExamResults.filter(r => r.exam_type === 'TYT').length} sınav
                              </div>
                            </div>
                          </div>

                          {/* AYT Average */}
                          <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-700 mb-1">
                                {mockExamResults.filter(r => r.exam_type === 'AYT').length > 0 
                                  ? (mockExamResults
                                      .filter(r => r.exam_type === 'AYT')
                                      .reduce((acc, r) => acc + (r.ayt_total_net || 0), 0) / 
                                      mockExamResults.filter(r => r.exam_type === 'AYT').length
                                    ).toFixed(1)
                                  : '0.0'
                                }
                              </div>
                              <div className="text-sm font-medium text-purple-800">AYT Ortalama Net</div>
                              <div className="text-xs text-purple-600 mt-1">
                                {mockExamResults.filter(r => r.exam_type === 'AYT').length} sınav
                              </div>
                            </div>
                          </div>

                          {/* Tarama Average */}
                          <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-700 mb-1">
                                {mockExamResults.filter(r => r.exam_type === 'Tarama').length > 0 
                                  ? (mockExamResults
                                      .filter(r => r.exam_type === 'Tarama')
                                      .reduce((acc, r) => acc + (r.tarama_total_net || (r.tarama_lessons?.reduce((sum, lesson) => sum + lesson.net, 0)) || 0), 0) / 
                                      mockExamResults.filter(r => r.exam_type === 'Tarama').length
                                    ).toFixed(1)
                                  : '0.0'
                                }
                              </div>
                              <div className="text-sm font-medium text-green-800">Tarama Ortalama Net</div>
                              <div className="text-xs text-green-600 mt-1">
                                {mockExamResults.filter(r => r.exam_type === 'Tarama').length} sınav
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏆</div>
                      <p className="text-sm text-gray-500">
                        Sınav sonuçlarını görüntülemek için bir öğrenci seçin.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tools' && (
                <div className="space-y-6 mb-6">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    🛠️ Araçlar ve Kaynaklar
                  </h3>
                  
                  {selectedStudent ? (
                    <>
                      {/* Study Tools Section */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                          📚 Çalışma Araçları
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          <PomodoroTimer onTimerComplete={() => {
                            // Notification is now handled within the component
                          }} />
                        </div>
                      </div>

                      {/* Educational Links Section */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                          🔗 Faydalı Linkler
                        </h4>
                        {educationalLinks.length > 0 ? (
                          <div className="space-y-2">
                            {educationalLinks.map((link) => (
                              <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-full p-3 text-left border rounded-lg transition-colors flex items-center justify-between group hover:shadow-md ${
                                  link.icon_color === 'blue' ? 'hover:bg-blue-50 hover:border-blue-200' :
                                  link.icon_color === 'green' ? 'hover:bg-green-50 hover:border-green-200' :
                                  link.icon_color === 'red' ? 'hover:bg-red-50 hover:border-red-200' :
                                  link.icon_color === 'purple' ? 'hover:bg-purple-50 hover:border-purple-200' :
                                  link.icon_color === 'orange' ? 'hover:bg-orange-50 hover:border-orange-200' :
                                  link.icon_color === 'indigo' ? 'hover:bg-indigo-50 hover:border-indigo-200' :
                                  'hover:bg-gray-50 hover:border-gray-200'
                                }`}
                              >
                                <div className="flex items-center">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                                    link.icon_color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                    link.icon_color === 'green' ? 'bg-green-100 text-green-600' :
                                    link.icon_color === 'red' ? 'bg-red-100 text-red-600' :
                                    link.icon_color === 'purple' ? 'bg-purple-100 text-purple-600' :
                                    link.icon_color === 'orange' ? 'bg-orange-100 text-orange-600' :
                                    link.icon_color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    <span className="text-sm font-bold">
                                      {link.icon_letter || link.title.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{link.title}</div>
                                    {link.description && (
                                      <div className="text-xs text-gray-500">{link.description}</div>
                                    )}
                                  </div>
                                </div>
                                <ExternalLink className={`h-4 w-4 text-gray-400 transition-colors ${
                                  link.icon_color === 'blue' ? 'group-hover:text-blue-600' :
                                  link.icon_color === 'green' ? 'group-hover:text-green-600' :
                                  link.icon_color === 'red' ? 'group-hover:text-red-600' :
                                  link.icon_color === 'purple' ? 'group-hover:text-purple-600' :
                                  link.icon_color === 'orange' ? 'group-hover:text-orange-600' :
                                  link.icon_color === 'indigo' ? 'group-hover:text-indigo-600' :
                                  'group-hover:text-gray-600'
                                }`} />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50 text-center">
                            <Link className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                            <h5 className="font-medium text-gray-900 mb-2">Henüz Link Yok</h5>
                            <p className="text-sm text-gray-600 mb-4">
                              Admin tarafından eğitim linkleri eklendiğinde burada görünecek.
                            </p>
                            <div className="text-xs text-blue-600 bg-blue-100 rounded-full px-3 py-1 inline-block">
                              Admin panelinde "Yararlı Linkler" bölümünden düzenleyin
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🛠️</div>
                      <p className="text-sm text-gray-500">
                        Araçları kullanmak için bir öğrenci seçin.
                      </p>
                    </div>
                  )}
                </div>
              )}
                         </div>
           </div>
           </ResizablePanel>
         </ResizablePanelGroup>
       </div>
     </div>
   )
 } 