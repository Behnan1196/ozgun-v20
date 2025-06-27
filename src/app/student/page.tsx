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
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable'
import StreamChat from '@/components/StreamChat'
import StreamVideo from '@/components/StreamVideo'
import MobileBottomNav from '@/components/MobileBottomNav'

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

interface Task {
  id: string
  title: string
  description?: string
  subject_id?: string
  topic_id?: string
  resource_id?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date?: string
  scheduled_date: string
  scheduled_start_time?: string
  scheduled_end_time?: string
  estimated_duration: number
  problem_count?: number
  priority: 'low' | 'medium' | 'high'
  task_type: 'study' | 'practice' | 'exam' | 'review' | 'resource'
  assigned_to: string
  assigned_by: string
  created_at: string
  updated_at: string
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

export default function StudentPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [assignedCoach, setAssignedCoach] = useState<any>(null)
  const [weeklyTasks, setWeeklyTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('statistics')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [weekDates, setWeekDates] = useState<Date[]>([])
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    full_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
    avatar_url: ''
  })

  const supabase = createClient()
  const userMenuRef = useRef<HTMLDivElement>(null)

  const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

  // Click outside handler for user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  // Load user and basic data
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUser(user)
      setProfile(profile)
      setLoading(false)
    }

    loadUser()
  }, [])

  // Load assigned coach
  useEffect(() => {
    const loadAssignedCoach = async () => {
      if (!user) return

      try {
        const { data: assignment } = await supabase
          .from('coach_student_assignments')
          .select('coach_id')
          .eq('student_id', user.id)
          .eq('is_active', true)
          .single()

        if (assignment) {
          const { data: coach } = await supabase
            .from('user_profiles')
            .select('id, full_name, email, avatar_url')
            .eq('id', assignment.coach_id)
            .single()

          setAssignedCoach(coach)
        }
      } catch (error) {
        console.error('Error loading assigned coach:', error)
      }
    }

    loadAssignedCoach()
  }, [user])

  // Load subjects, topics, resources
  useEffect(() => {
    const loadSubjects = async () => {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name')
      setSubjects(subjects || [])
    }

    const loadTopics = async () => {
      const { data: topics } = await supabase
        .from('topics')
        .select('*')
        .eq('is_active', true)
        .order('order_index')
      setTopics(topics || [])
    }

    const loadResources = async () => {
      const { data: resources } = await supabase
        .from('resources')
        .select('*')
        .eq('is_active', true)
        .order('name')
      setResources(resources || [])
    }

    loadSubjects()
    loadTopics()
    loadResources()
  }, [])

  // Load tasks and calculate week dates
  useEffect(() => {
    const loadWeeklyTasks = async () => {
      if (!user) return

      // Calculate week dates
      const weekStart = getWeekStart(currentWeek)
      const dates = getWeekDates(weekStart)
      setWeekDates(dates)

      try {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', user.id)
          .gte('scheduled_date', dates[0].toISOString().split('T')[0])
          .lte('scheduled_date', dates[6].toISOString().split('T')[0])
          .order('scheduled_date', { ascending: true })

        setWeeklyTasks(tasks || [])
      } catch (error) {
        console.error('Error loading tasks:', error)
      }
    }

    loadWeeklyTasks()
  }, [user, currentWeek])

  // Helper functions
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  const getWeekDates = (date: Date) => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(date)
      d.setDate(date.getDate() + i)
      dates.push(d)
    }
    return dates
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const formatDate = (date: Date) => {
    if (!date || !(date instanceof Date)) return ''
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const openSettingsModal = () => {
    if (profile) {
      setSettingsForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        current_password: '',
        new_password: '',
        confirm_password: '',
        avatar_url: profile.avatar_url || ''
      })
    }
    setShowSettingsModal(true)
    setUserMenuOpen(false)
  }

  const closeSettingsModal = () => {
    setShowSettingsModal(false)
    setSettingsForm({
      full_name: '',
      email: '',
      current_password: '',
      new_password: '',
      confirm_password: '',
      avatar_url: ''
    })
  }

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: settingsForm.full_name,
          avatar_url: settingsForm.avatar_url
        })
        .eq('id', user?.id)

      if (error) throw error

      // Reload user profile
      const { data: updatedProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single()
      
      setProfile(updatedProfile)
      closeSettingsModal()
      alert('Profil başarıyla güncellendi!')
    } catch (error) {
      console.error('Profile update error:', error)
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

      if (error) throw error

      closeSettingsModal()
      alert('Şifre başarıyla güncellendi!')
    } catch (error) {
      console.error('Password update error:', error)
      alert('Şifre güncellenirken hata oluştu.')
    }
  }

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed'
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (!error) {
        // Update local state
        setWeeklyTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === task.id 
              ? { ...t, status: newStatus }
              : t
          )
        )
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleTaskClick = (task: Task) => {
    // For resource tasks, open the resource link
    if (task.task_type === 'resource' && task.resource_id) {
      const resource = resources.find(r => r.id === task.resource_id)
      if (resource) {
        window.open(resource.url, '_blank')
        // Auto-complete resource tasks when clicked
        if (task.status !== 'completed') {
          toggleTaskCompletion(task)
        }
      }
    } else {
      // For other tasks, just toggle completion
      toggleTaskCompletion(task)
    }
  }

  const getTasksForDay = (date: Date) => {
    return weeklyTasks.filter(task => {
      const taskDate = new Date(task.scheduled_date)
      return taskDate.toDateString() === date.toDateString()
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 mobile-hide">TYT AYT Koçluk Sistemi</h1>
              <h1 className="text-lg font-bold text-gray-900 mobile-show">TYT AYT</h1>
              <span className="text-sm text-gray-500 mobile-hide">Öğrenci Paneli</span>
            </div>
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800 overflow-hidden"
                title={profile?.full_name || 'Öğrenci'}
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-medium">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'Ö'}
                  </span>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-10 w-48 bg-slate-700 rounded-md shadow-lg py-1 z-50 border border-slate-600">
                  <div className="px-4 py-2 text-sm text-gray-200 border-b border-slate-600">
                    <div className="font-medium">{profile?.full_name || 'Öğrenci'}</div>
                    <div className="text-xs text-gray-400">Öğrenci</div>
                  </div>
                  
                  <button
                    onClick={openSettingsModal}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-600 hover:text-white flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Ayarlar
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-600 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Coach Info - Desktop only */}
          {assignedCoach && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg mobile-hide">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full">
                  {assignedCoach.avatar_url ? (
                    <img src={assignedCoach.avatar_url} alt="Coach" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-sm font-medium">
                      {assignedCoach.full_name?.charAt(0)?.toUpperCase() || 'K'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Koçunuz: {assignedCoach.full_name}
                  </div>
                  <div className="text-xs text-gray-500">{assignedCoach.email}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content with Resizable Panels - Desktop only */}
      <div className="h-[calc(100vh-7rem)] mobile-hide">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Weekly Plan */}
          <ResizablePanel defaultSize={75} minSize={50} className="bg-white">
            <div className="p-6 h-full flex flex-col">
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigateWeek('prev')}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    <span>Haftalık Görevlerim</span>
                  </h2>
                  
                  <button
                    onClick={() => navigateWeek('next')}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                  <span className="font-medium">
                    {weekDates.length > 0 ? `${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}` : 'Yükleniyor...'}
                  </span>
                </div>
              </div>

              {/* Weekly Calendar Grid */}
              <div className="flex-1 overflow-y-auto bg-slate-100 p-4 rounded-lg">
                {weekDates.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Haftalık program yükleniyor...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 weekly-calendar-grid pb-4">
                    {weekDates.map((date, index) => {
                    const dayTasks = getTasksForDay(date)
                    const completedTasks = dayTasks.filter(t => t.status === 'completed').length
                    const totalTasks = dayTasks.length
                    
                    return (
                      <div key={index} className="day-card flex flex-col bg-white rounded-xl shadow-md border border-gray-300 hover:shadow-xl transition-all duration-200 overflow-hidden">
                        {/* Day Header */}
                        <div className="day-header bg-gradient-to-br from-slate-50 to-gray-100 border-b border-gray-200">
                          <div className="flex items-center justify-between px-3 py-2">
                            <div className="text-xs text-slate-500 font-medium">
                              {formatDate(date)}
                            </div>
                            <div className="text-sm font-semibold text-slate-700">
                              {dayNames[index]}
                            </div>
                            <div className="w-4"></div> {/* Spacer for alignment */}
                          </div>
                          
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
                        
                        {/* Day Content */}
                        <div className="flex-1 space-y-2.5 p-3 min-h-0 overflow-y-auto">
                          {dayTasks.map((task) => {
                            const subject = subjects.find(s => s.id === task.subject_id)
                            const topic = topics.find(t => t.id === task.topic_id)
                            const resource = resources.find(r => r.id === task.resource_id)
                            
                            const getTaskTypeStyle = (taskType: string, isCompleted: boolean) => {
                              const baseStyle = "p-3 border-l-4 rounded-lg transition-all hover:shadow-md cursor-pointer border border-gray-200"
                              
                              if (isCompleted) {
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
                                default:
                                  return `${baseStyle} border-l-gray-500 bg-gray-50 hover:bg-gray-100 hover:border-gray-300`
                              }
                            }
                            
                            return (
                              <div 
                                key={task.id} 
                                onClick={() => handleTaskClick(task)}
                                className={`task-card group ${getTaskTypeStyle(task.task_type, task.status === 'completed')}`}
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <div className="flex items-center space-x-1">
                                    {task.task_type === 'study' && <BookOpen className="h-3 w-3 text-blue-600" />}
                                    {task.task_type === 'practice' && <Calculator className="h-3 w-3 text-orange-600" />}
                                    {task.task_type === 'exam' && <FileText className="h-3 w-3 text-red-600" />}
                                    {task.task_type === 'review' && <BarChart3 className="h-3 w-3 text-purple-600" />}
                                    {task.task_type === 'resource' && <Link className="h-3 w-3 text-indigo-600" />}
                                    <span className="text-xs font-semibold text-gray-700">
                                      {task.task_type === 'study' ? 'ÇALIŞMA' :
                                       task.task_type === 'practice' ? 'SORU ÇÖZ' :
                                       task.task_type === 'exam' ? 'SINAV' :
                                       task.task_type === 'resource' ? 'KAYNAK' : 'TEKRAR'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {task.status === 'completed' ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <div className="h-4 w-4 border-2 border-gray-400 rounded-full hover:border-gray-600 transition-colors"></div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Show resource, subject-topic, or custom title */}
                                {resource ? (
                                  <div className="text-xs text-indigo-700 mb-1 font-medium">
                                    <span className="cursor-pointer hover:underline">
                                      {resource.name}
                                    </span>
                                    <span className="text-gray-600 ml-1">({resource.category.toUpperCase()})</span>
                                  </div>
                                ) : (subject || topic) ? (
                                  <div className="text-xs text-gray-700 mb-1 font-medium">
                                    {subject && topic ? `${subject.name} - ${topic.name}` :
                                     subject ? subject.name :
                                     topic ? topic.name : ''}
                                  </div>
                                ) : task.title !== 'Görev' && (
                                  <div className={`text-xs font-medium mb-1 line-clamp-2 ${
                                    task.status === 'completed' ? 'text-gray-600 line-through' : 'text-gray-800'
                                  }`}>
                                    {task.title}
                                  </div>
                                )}

                                {/* Show task description if it exists */}
                                {task.description && task.description.trim() && (
                                  <div className={`text-xs mb-1 line-clamp-2 ${
                                    task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-600'
                                  }`}>
                                    {task.description}
                                  </div>
                                )}

                                {/* Task metadata */}
                                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                  <div className="flex items-center space-x-2">
                                    {task.scheduled_start_time && (
                                      <span className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {task.scheduled_start_time}
                                      </span>
                                    )}
                                    {task.estimated_duration && (
                                      <span className="flex items-center">
                                        <Timer className="h-3 w-3 mr-1" />
                                        {task.estimated_duration} dk
                                      </span>
                                    )}
                                  </div>
                                  {task.problem_count && (
                                    <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                                      📊 {task.problem_count} soru
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Tabbed Interface */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-white">
            <div className="h-full flex flex-col">
              {/* Tab Headers */}
              <div className="border-b">
                <div className="flex">
                  {[
                    { id: 'statistics', label: 'Gelişimim', icon: BarChart3 },
                    { id: 'profile', label: 'Bilgilerim', icon: User },
                    { id: 'chat', label: 'Chat', icon: MessageCircle },
                    { id: 'video', label: 'Video', icon: Video },
                    { id: 'goals', label: 'Hedefler', icon: Target },
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
                  <div className="space-y-6">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      📊 Gelişim İstatistikleri
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Progress Overview Cards */}
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium text-green-800">
                              Bu Hafta Tamamlanan
                            </div>
                            <div className="text-green-600">✓</div>
                          </div>
                          <div className="text-3xl font-bold text-green-700 mb-2">
                            {Math.round((weeklyTasks.filter(t => t.status === 'completed').length / Math.max(weeklyTasks.length, 1)) * 100)}%
                          </div>
                          <div className="text-xs text-green-600 mb-3">
                            {weeklyTasks.filter(t => t.status === 'completed').length}/{weeklyTasks.length} görev
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-green-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.round((weeklyTasks.filter(t => t.status === 'completed').length / Math.max(weeklyTasks.length, 1)) * 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium text-blue-800">
                              Toplam Çalışma Saati
                            </div>
                            <div className="text-blue-600">⏰</div>
                          </div>
                          <div className="text-3xl font-bold text-blue-700 mb-2">
                            {Math.round(weeklyTasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.estimated_duration, 0) / 60 * 10) / 10}h
                          </div>
                          <div className="text-xs text-blue-600 mb-3">
                            Bu hafta tahmini
                          </div>
                          {/* Study Hours Visualization */}
                          <div className="flex items-end space-x-1 h-8">
                            {[1,2,3,4,5,6,7].map((day, index) => {
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
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Task Type Distribution */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                        <div className="text-sm font-medium text-purple-800 mb-4 flex items-center">
                          📈 Görev Türü Dağılımı
                        </div>
                        <div className="space-y-3">
                          {(() => {
                            const taskTypes = ['study', 'practice', 'exam', 'review', 'resource']
                            const taskTypeNames: Record<string, string> = {
                              'study': 'Çalışma',
                              'practice': 'Soru Çöz',
                              'exam': 'Sınav',
                              'review': 'Tekrar',
                              'resource': 'Kaynak'
                            }
                            const taskTypeColors: Record<string, string> = {
                              'study': 'bg-blue-500',
                              'practice': 'bg-green-500',
                              'exam': 'bg-red-500',
                              'review': 'bg-yellow-500',
                              'resource': 'bg-indigo-500'
                            }
                            
                            return taskTypes.map(type => {
                              const count = weeklyTasks.filter(t => t.task_type === type).length
                              const percentage = weeklyTasks.length > 0 ? (count / weeklyTasks.length) * 100 : 0
                              
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

                      {/* Weekly Performance Chart */}
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                        <div className="text-sm font-medium text-orange-800 mb-4 flex items-center">
                          📅 Haftalık Performans
                        </div>
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
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      👤 Öğrenci Bilgileri
                    </h3>
                    
                    {profile && (
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">Ad Soyad</div>
                          <div className="text-lg font-semibold text-gray-900">{profile.full_name}</div>
                        </div>
                        
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">E-posta</div>
                          <div className="text-gray-900">{profile.email}</div>
                        </div>

                        {assignedCoach && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium text-blue-700 mb-1">Koçunuz</div>
                            <div className="text-blue-900 font-semibold">{assignedCoach.full_name}</div>
                            <div className="text-xs text-blue-600">{assignedCoach.email}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'chat' && (
                  <div className="space-y-6">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      💬 Chat
                    </h3>
                    
                                         {assignedCoach ? (
                       <StreamChat 
                         partnerId={assignedCoach.id}
                         partnerName={assignedCoach.full_name}
                       />
                     ) : (
                      <div className="text-center py-12">
                        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Koçunuz atanmamış.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'video' && (
                  <div className="space-y-6">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      🎥 Video Görüşme
                    </h3>
                    
                                         {assignedCoach ? (
                       <StreamVideo 
                         partnerId={assignedCoach.id}
                         partnerName={assignedCoach.full_name}
                       />
                     ) : (
                      <div className="text-center py-12">
                        <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Koçunuz atanmamış.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'goals' && (
                  <div className="space-y-6">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      🎯 Hedeflerim
                    </h3>
                    
                    <div className="text-center py-12">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Hedefler yakında eklenecek.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'tools' && (
                  <div className="space-y-6">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      🛠️ Araçlar
                    </h3>
                    
                    <div className="text-center py-12">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Araçlar yakında eklenecek.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile Content - Mobile only */}
      <div className="mobile-show pb-20">
        <div className="p-4">
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center">
                📊 Gelişim İstatistikleri
              </h3>
              
              <div className="space-y-4">
                {/* Progress Overview Cards */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-green-800">
                        Bu Hafta Tamamlanan
                      </div>
                      <div className="text-green-600">✓</div>
                    </div>
                    <div className="text-3xl font-bold text-green-700 mb-2">
                      {Math.round((weeklyTasks.filter(t => t.status === 'completed').length / Math.max(weeklyTasks.length, 1)) * 100)}%
                    </div>
                    <div className="text-xs text-green-600 mb-3">
                      {weeklyTasks.filter(t => t.status === 'completed').length}/{weeklyTasks.length} görev
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round((weeklyTasks.filter(t => t.status === 'completed').length / Math.max(weeklyTasks.length, 1)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-blue-800">
                        Toplam Çalışma Saati
                      </div>
                      <div className="text-blue-600">⏰</div>
                    </div>
                    <div className="text-3xl font-bold text-blue-700 mb-2">
                      {Math.round(weeklyTasks.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.estimated_duration, 0) / 60 * 10) / 10}h
                    </div>
                    <div className="text-xs text-blue-600">
                      Bu hafta tahmini
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Default mobile content - Weekly Plan */}
          {(activeTab === 'statistics' || !activeTab || activeTab === 'plan') && (
            <div className="space-y-6 mt-6">
              {/* Week Navigation */}
              <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigateWeek('prev')}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>Plan</span>
                  </h2>
                  
                  <button
                    onClick={() => navigateWeek('next')}
                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                  <span className="font-medium">
                    {weekDates.length > 0 ? formatDate(weekDates[0]) : 'Yükleniyor...'}
                  </span>
                </div>
              </div>

              {/* Mobile Weekly Calendar Grid */}
              <div className="bg-slate-100 p-4 rounded-lg">
                {weekDates.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Yükleniyor...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1">
                    {weekDates.map((date, index) => {
                      const dayTasks = getTasksForDay(date)
                      const completedTasks = dayTasks.filter(t => t.status === 'completed').length
                      const totalTasks = dayTasks.length
                      
                      return (
                        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                          {/* Day Header */}
                          <div className="bg-gradient-to-r from-slate-50 to-gray-100 border-b border-gray-200 p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-slate-700">
                                {dayNames[index]}
                              </div>
                              <div className="text-xs text-slate-500 font-medium">
                                {formatDate(date)}
                              </div>
                            </div>
                            <div className="mt-2">
                              {totalTasks > 0 ? (
                                <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                  {completedTasks}/{totalTasks} görev
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">Görev yok</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Day Content */}
                          <div className="p-3 space-y-3">
                            {dayTasks.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                Bugün için görev yok
                              </div>
                            ) : (
                              dayTasks.map((task) => {
                                const subject = subjects.find(s => s.id === task.subject_id)
                                const topic = topics.find(t => t.id === task.topic_id)
                                
                                return (
                                  <div 
                                    key={task.id} 
                                    onClick={() => toggleTaskCompletion(task)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                      task.status === 'completed'
                                        ? 'bg-green-50 border-green-200 opacity-75'
                                        : 'bg-white border-gray-200 hover:shadow-md'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="text-xs font-semibold text-blue-600">
                                            {task.task_type === 'study' ? 'ÇALIŞMA' :
                                             task.task_type === 'practice' ? 'SORU ÇÖZ' :
                                             task.task_type === 'exam' ? 'SINAV' :
                                             task.task_type === 'resource' ? 'KAYNAK' : 'TEKRAR'}
                                          </span>
                                        </div>
                                        
                                        {subject && topic && (
                                          <div className="text-sm font-medium text-gray-800 mb-1">
                                            {subject.name} - {topic.name}
                                          </div>
                                        )}
                                        
                                        {task.description && (
                                          <div className="text-sm text-gray-600 mb-2">
                                            {task.description}
                                          </div>
                                        )}
                                        
                                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                                          {task.scheduled_start_time && (
                                            <span>⏰ {task.scheduled_start_time}</span>
                                          )}
                                          {task.estimated_duration && (
                                            <span>⏱️ {task.estimated_duration} dk</span>
                                          )}
                                          {task.problem_count && (
                                            <span>📊 {task.problem_count} soru</span>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="ml-3">
                                        {task.status === 'completed' ? (
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                          <div className="h-5 w-5 border-2 border-gray-400 rounded-full"></div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center">
                👤 Öğrenci Bilgileri
              </h3>
              
              {profile && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Ad Soyad</div>
                    <div className="text-lg font-semibold text-gray-900">{profile.full_name}</div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">E-posta</div>
                    <div className="text-gray-900">{profile.email}</div>
                  </div>

                  {assignedCoach && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-700 mb-1">Koçunuz</div>
                      <div className="text-blue-900 font-semibold">{assignedCoach.full_name}</div>
                      <div className="text-xs text-blue-600">{assignedCoach.email}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mobile Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center">
                💬 Chat
              </h3>
              
              {assignedCoach ? (
                <StreamChat 
                  partnerId={assignedCoach.id}
                  partnerName={assignedCoach.full_name}
                />
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Koçunuz atanmamış.</p>
                </div>
              )}
            </div>
          )}

          {/* Mobile Video Tab */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center">
                🎥 Video Görüşme
              </h3>
              
              {assignedCoach ? (
                <StreamVideo 
                  partnerId={assignedCoach.id}
                  partnerName={assignedCoach.full_name}
                />
              ) : (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Koçunuz atanmamış.</p>
                </div>
              )}
            </div>
          )}

          {/* Mobile Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center">
                🎯 Hedeflerim
              </h3>
              
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Hedefler yakında eklenecek.</p>
              </div>
            </div>
          )}

          {/* Mobile Tools Tab */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center">
                🛠️ Araçlar
              </h3>
              
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Araçlar yakında eklenecek.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Ayarlar</h3>
              <button
                onClick={closeSettingsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Settings */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Profil Bilgileri</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={settingsForm.full_name}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, full_name: e.target.value }))}
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
                      placeholder="E-posta değiştirilemez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Avatar URL (Opsiyonel)
                    </label>
                    <input
                      type="url"
                      value={settingsForm.avatar_url}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>

                  <button
                    onClick={updateProfile}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Profili Güncelle
                  </button>
                </div>
              </div>

              {/* Password Settings */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Şifre Değiştir</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yeni Şifre
                    </label>
                    <input
                      type="password"
                      value={settingsForm.new_password}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, new_password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Yeni şifre (en az 6 karakter)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yeni Şifre (Tekrar)
                    </label>
                    <input
                      type="password"
                      value={settingsForm.confirm_password}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Yeni şifre tekrar"
                    />
                  </div>

                  <button
                    onClick={updatePassword}
                    disabled={!settingsForm.new_password || !settingsForm.confirm_password}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Şifreyi Güncelle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role="student" />
    </div>
  )
}