import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// Real Task interface from database
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
  completed_at?: string
  // Relations (Supabase can return arrays or objects)
  subjects?: { name: string } | { name: string }[]
  topics?: { name: string } | { name: string }[]
  resources?: { name: string; url: string } | { name: string; url: string }[]
}

// Simplified Task interface for calendar view
interface CalendarTask {
  id: string
  title: string
  scheduled_date: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  task_type: 'study' | 'practice' | 'exam' | 'review' | 'resource'
  assigned_to: string
}

export default function StudyScreen() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('today')
  const [weeklyTasks, setWeeklyTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date()) // Add current week state
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date()) // Add current month state
  const [monthlyTasks, setMonthlyTasks] = useState<CalendarTask[]>([]) // Add monthly tasks for calendar

  // Helper function to format date as YYYY-MM-DD without timezone issues
  const formatDateString = (date: Date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  }

  // Get current week start (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days to subtract to get to Monday
    let daysToSubtract
    if (day === 0) {
      daysToSubtract = 6 // Sunday: go back 6 days to Monday
    } else {
      daysToSubtract = day - 1 // Monday(1)->0, Tuesday(2)->1, etc.
    }
    
    const mondayDate = new Date(d)
    mondayDate.setDate(d.getDate() - daysToSubtract)
    return mondayDate
  }

  // Get week date range for display
  const getWeekDateRange = () => {
    const startDate = getWeekStart(currentWeek)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }

  // Navigate week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    if (direction === 'prev') {
      newWeek.setDate(newWeek.getDate() - 7)
    } else {
      newWeek.setDate(newWeek.getDate() + 7)
    }
    setCurrentWeek(newWeek)
  }

  // Get current month start and end
  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  const getMonthEnd = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  }

  // Navigate month
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  // Jump to specific week when day is selected
  const jumpToWeek = (date: Date) => {
    // Set the week to the Monday of the week containing the selected date
    const weekStart = getWeekStart(date)
    

    
    setCurrentWeek(weekStart)
    setActiveTab('weekly') // Switch to weekly tab
  }

  // Get tasks for specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = formatDateString(date)
    return monthlyTasks.filter(task => task.scheduled_date === dateStr)
  }

  // Fetch weekly tasks and setup real-time subscription
  useEffect(() => {
    const fetchWeeklyTasks = async () => {
      if (!user) return

      try {
        setLoading(true)
        const weekStart = getWeekStart(currentWeek)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)

        // Format date strings manually to avoid timezone conversion issues
        const weekStartStr = formatDateString(weekStart)
        const weekEndStr = formatDateString(weekEnd)

        const { data, error } = await supabase
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
            completed_at,
            subjects(name),
            topics(name),
            resources(name, url)
          `)
          .eq('assigned_to', user.id)
          .gte('scheduled_date', weekStartStr)
          .lte('scheduled_date', weekEndStr)
          .order('scheduled_date')
          .order('scheduled_start_time')

        if (error) {
          console.error('Error fetching tasks:', error)
          Alert.alert('Hata', 'Görevler yüklenirken bir hata oluştu')
          return
        }

        setWeeklyTasks(data || [])
      } catch (error) {
        console.error('Error:', error)
        Alert.alert('Hata', 'Beklenmeyen bir hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    // Setup real-time subscription for task updates
    const setupRealtimeSubscription = () => {
      if (!user) return null

      try {

        
        const subscription = supabase
          .channel(`task-updates-${user.id}`, {
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
              filter: `assigned_to=eq.${user.id}`
            },
            (payload) => {
              
              if (payload.eventType === 'UPDATE') {
  
                // Fetch the full task with relations since payload.new doesn't include joined data
                const fetchUpdatedTask = async () => {
                  try {
                    const { data } = await supabase
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
                        completed_at,
                        subjects(name),
                        topics(name),
                        resources(name, url)
                      `)
                      .eq('id', payload.new.id)
                      .single()
                    
                    if (data) {
                      // Check if the updated task is still in the current week
                      const taskDate = new Date(data.scheduled_date)
                      const weekStart = getWeekStart(currentWeek)
                      const weekEnd = new Date(weekStart)
                      weekEnd.setDate(weekStart.getDate() + 6)
                      
                      if (taskDate >= weekStart && taskDate <= weekEnd) {
                        // Task is still in current week, update it
                        setWeeklyTasks(prev => prev.map(task => 
                          task.id === payload.new.id ? data : task
                        ))
                      } else {
                        // Task was moved to a different week, remove it from current view

                        setWeeklyTasks(prev => prev.filter(task => task.id !== payload.new.id))
                      }
                    } else {
                      // Task might have been deleted or is no longer assigned to this student
                      
                      setWeeklyTasks(prev => prev.filter(task => task.id !== payload.new.id))
                    }
                  } catch (error) {
                    console.error('Error fetching updated task:', error)
                  }
                }
                fetchUpdatedTask()
              } else if (payload.eventType === 'INSERT') {

                // Check if the new task is in the current week
                const taskDate = new Date(payload.new.scheduled_date)
                const weekStart = getWeekStart(currentWeek)
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekStart.getDate() + 6)
                
                if (taskDate >= weekStart && taskDate <= weekEnd) {
                  // Fetch the full task with relations
                  const fetchNewTask = async () => {
                    const { data } = await supabase
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
                        completed_at,
                        subjects(name),
                        topics(name),
                        resources(name, url)
                      `)
                      .eq('id', payload.new.id)
                      .single()
                    
                    if (data) {
                      setWeeklyTasks(prev => [...prev, data])
                    }
                  }
                  fetchNewTask()
                }
              } else if (payload.eventType === 'DELETE') {
                const deletedTaskId = (payload.old as any)?.id
                
                if (!deletedTaskId) {
                  return
                }
                
                setWeeklyTasks(prev => {
                  const taskExists = prev.some(task => task.id === deletedTaskId)
                  
                  if (!taskExists) {
                    return prev
                  }
                  
                  return prev.filter(task => task.id !== deletedTaskId)
                })
              }
            }
          )
          
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setRealtimeConnected(true)
            } else if (status === 'CHANNEL_ERROR') {
              setRealtimeConnected(false)
            } else if (status === 'TIMED_OUT') {
              setRealtimeConnected(false)
            } else if (status === 'CLOSED') {
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

    fetchWeeklyTasks()
    const subscription = setupRealtimeSubscription()

    // Cleanup subscription on unmount or dependency change
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
     }, [user, currentWeek])

  // Fallback polling mechanism when real-time is not connected
  useEffect(() => {
    if (!user || realtimeConnected) return

    
    
    const pollInterval = setInterval(async () => {
      try {
        const weekStart = getWeekStart(currentWeek)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)

        const { data: tasks } = await supabase
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
            completed_at,
            subjects(name),
            topics(name),
            resources(name, url)
          `)
          .eq('assigned_to', user.id)
          .gte('scheduled_date', weekStart.toISOString().split('T')[0])
          .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
          .order('scheduled_date')
          .order('scheduled_start_time')

        if (tasks) {
          setWeeklyTasks(prev => {
            // Check for any changes including additions, deletions, and updates
            const prevIds = new Set(prev.map(t => t.id))
            const newIds = new Set(tasks.map(t => t.id))
            
            // Check if tasks were added or removed
            const tasksAdded = tasks.some(task => !prevIds.has(task.id))
            const tasksRemoved = prev.some(task => !newIds.has(task.id))
            
            // Check if existing tasks were updated
            const hasUpdates = tasks.some(newTask => {
              const existingTask = prev.find(t => t.id === newTask.id)
              return existingTask && (
                existingTask.status !== newTask.status || 
                existingTask.completed_at !== newTask.completed_at ||
                existingTask.updated_at !== newTask.updated_at ||
                existingTask.subject_id !== newTask.subject_id ||
                existingTask.topic_id !== newTask.topic_id ||
                existingTask.resource_id !== newTask.resource_id ||
                existingTask.title !== newTask.title ||
                existingTask.scheduled_date !== newTask.scheduled_date
              )
            })
            
                         if (tasksAdded || tasksRemoved || hasUpdates) {
               console.log('📋 Polling detected changes:', {
                 tasksAdded: tasksAdded ? 'YES' : 'NO',
                 tasksRemoved: tasksRemoved ? 'YES' : 'NO', 
                 hasUpdates: hasUpdates ? 'YES' : 'NO'
               })
               if (tasksRemoved) {
                 const removedTaskIds = prev.filter(task => !newIds.has(task.id)).map(t => t.id)
                 console.log('📋 Removed tasks detected via polling:', removedTaskIds)
               }
               return tasks
             }
            
            return prev
          })
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000) // Poll every 2 seconds when real-time is not working

    return () => clearInterval(pollInterval)
     }, [user, currentWeek, realtimeConnected])

  // Fetch monthly tasks for calendar view
  useEffect(() => {
    const fetchMonthlyTasks = async () => {
      if (!user) return

      try {
        const monthStart = getMonthStart(currentMonth)
        const monthEnd = getMonthEnd(currentMonth)

        // Format date strings manually to avoid timezone conversion issues
        const monthStartStr = formatDateString(monthStart)
        const monthEndStr = formatDateString(monthEnd)

        const { data, error } = await supabase
          .from('tasks')
          .select(`
            id,
            title,
            scheduled_date,
            status,
            task_type,
            assigned_to
          `)
          .eq('assigned_to', user.id)
          .gte('scheduled_date', monthStartStr)
          .lte('scheduled_date', monthEndStr)
          .order('scheduled_date')

        if (error) {
          console.error('Error fetching monthly tasks:', error)
          return
        }

        setMonthlyTasks(data || [])
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchMonthlyTasks()
  }, [user, currentMonth])

  // Toggle task completion
  const toggleTaskCompletion = async (taskId: string) => {
    if (!user) return

    try {
      const task = weeklyTasks.find(t => t.id === taskId)
      if (!task) return

      const isCompleted = task.status === 'completed'
      const newStatus = isCompleted ? 'pending' : 'completed'
      const completedAt = isCompleted ? null : new Date().toISOString()

      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: completedAt
        })
        .eq('id', taskId)

      if (error) {
        console.error('Error updating task:', error)
        Alert.alert('Hata', 'Görev güncellenirken bir hata oluştu')
        return
      }

      // Update local state
      setWeeklyTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus, completed_at: completedAt || undefined }
            : task
        )
      )
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu')
    }
  }

  // Get Turkish task type name
  const getTaskTypeName = (type: string) => {
    switch (type) {
      case 'resource':
        return 'KAYNAK'
      case 'study':
        return 'ÇALIŞMA'
      case 'practice':
        return 'SORU ÇÖZ'
      case 'exam':
        return 'SINAV'
      case 'review':
        return 'TEKRAR'
      default:
        return type.toUpperCase()
    }
  }

  // Get task type color
  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'resource':
        return '#22c55e' // green
      case 'study':
        return '#3b82f6' // blue
      case 'practice':
        return '#f59e0b' // orange
      case 'exam':
        return '#ef4444' // red
      case 'review':
        return '#8b5cf6' // purple
      default:
        return '#6b7280' // gray
    }
  }



  // Get tasks for specific day using currentWeek
  const getDayTasks = (day: string) => {
    const weekStart = getWeekStart(currentWeek) // Use currentWeek instead of new Date()
    const dayIndex = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].indexOf(day)
    
    // Create target date more explicitly to avoid timezone issues
    const targetDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + dayIndex)
    
    // Format date string manually to avoid timezone conversion issues
    const dateStr = formatDateString(targetDate)
    

    
    return weeklyTasks.filter(task => task.scheduled_date === dateStr)
  }

  // Get completion stats for a day
  const getDayStats = (day: string) => {
    const dayTasks = getDayTasks(day)
    const completedTasks = dayTasks.filter(task => task.status === 'completed').length
    return { completed: completedTasks, total: dayTasks.length }
  }

  // Get today's tasks
  const getTodayTasks = () => {
    const today = new Date()
    const todayStr = formatDateString(today)
    return weeklyTasks.filter(task => task.scheduled_date === todayStr)
  }

  // Get today's stats
  const getTodayStats = () => {
    const todayTasks = getTodayTasks()
    return {
      completed: todayTasks.filter(task => task.status === 'completed').length,
      total: todayTasks.length
    }
  }

  const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
  const todayTasks = getTodayTasks()
  const todayStats = getTodayStats()

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Görevler yükleniyor...</Text>
      </View>
    )
  }

  // Helper functions to safely extract data
  const getResource = (resources: any) => {
    if (!resources) return null
    return Array.isArray(resources) ? resources[0] : resources
  }

  const getSubject = (subjects: any) => {
    if (!subjects) return null
    return Array.isArray(subjects) ? subjects[0] : subjects
  }

  const getTopic = (topics: any) => {
    if (!topics) return null
    return Array.isArray(topics) ? topics[0] : topics
  }

  // Render calendar days
  const renderCalendarDays = () => {
    const monthStart = getMonthStart(currentMonth)
    const monthEnd = getMonthEnd(currentMonth)
    const startDate = new Date(monthStart)
    const endDate = new Date(monthEnd)
    
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = monthStart.getDay()
    
    // Convert to Monday-first: Monday=0, Tuesday=1, ..., Sunday=6
    let firstDayAdjusted
    if (firstDay === 0) {
      firstDayAdjusted = 6  // Sunday becomes position 6
    } else {
      firstDayAdjusted = firstDay - 1  // Monday(1)->0, Tuesday(2)->1, etc.
    }
    

    
    const days = []
    const totalDays = monthEnd.getDate()
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayAdjusted; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.emptyDay} />
      )
    }
    
    // Add days of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day)
      const dayTasks = getTasksForDate(date)
      const isToday = date.toDateString() === new Date().toDateString()
      
      const completedTasks = dayTasks.filter(task => task.status === 'completed').length
      const totalTasks = dayTasks.length
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday && styles.todayCalendarDay,
            totalTasks > 0 && styles.calendarDayWithTasks
          ]}
          onPress={() => jumpToWeek(date)}
        >
          <Text style={[
            styles.calendarDayText,
            isToday && styles.todayCalendarDayText,
            totalTasks > 0 && styles.calendarDayTextWithTasks
          ]}>
            {day}
          </Text>
          {totalTasks > 0 && (
            <View style={styles.taskIndicator}>
              <Text style={styles.taskIndicatorText}>
                {completedTasks}/{totalTasks}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )
    }
    
    return days
  }

  const renderTaskCard = (task: Task) => {
    const isCompleted = task.status === 'completed'
    const taskTypeColor = getTaskTypeColor(task.task_type)
    
    // Find related data like in web app
    const resource = getResource(task.resources)
    const subject = getSubject(task.subjects)
    const topic = getTopic(task.topics)
    
    return (
      <View key={task.id} style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <View style={[styles.taskTypeChip, { backgroundColor: taskTypeColor }]}>
            <Text style={styles.taskTypeText}>{getTaskTypeName(task.task_type)}</Text>
          </View>
          <Switch
            value={isCompleted}
            onValueChange={() => toggleTaskCompletion(task.id)}
            trackColor={{ false: '#e5e5e5', true: '#22c55e' }}
            thumbColor={isCompleted ? '#ffffff' : '#ffffff'}
          />
        </View>
        
        {/* Content Display Logic - Same as web app */}
        {resource ? (
          // Resource tasks: Show resource name and category
          <View style={styles.taskContentContainer}>
            <TouchableOpacity 
              onPress={() => {
                // TODO: Open resource URL
                Alert.alert('Kaynak', `${resource.name}\n${resource.url}`)
              }}
            >
              <Text style={[styles.resourceName, isCompleted && styles.completedText]}>
                {resource.name}
              </Text>
              <Text style={styles.resourceCategory}>
                ({resource.url ? 'LINK' : 'FILE'})
              </Text>
            </TouchableOpacity>
          </View>
        ) : (subject || topic) ? (
          // Subject/Topic tasks: Show subject - topic
          <View style={styles.taskContentContainer}>
            <Text style={[styles.taskTitle, isCompleted && styles.completedText]} numberOfLines={2}>
              {subject && topic ? `${subject.name} - ${topic.name}` :
               subject ? subject.name :
               topic ? topic.name : ''}
            </Text>
          </View>
        ) : task.title !== 'Görev' ? (
          // Custom title tasks: Show custom title
          <View style={styles.taskContentContainer}>
            <Text style={[styles.taskTitle, isCompleted && styles.completedText]} numberOfLines={2}>
              {task.title}
            </Text>
          </View>
        ) : null}
        
        {/* Show task description if it exists and is not empty */}
        {task.description && task.description.trim() && (
          <Text style={[styles.taskDescription, isCompleted && styles.completedText]} numberOfLines={2}>
            {task.description}
          </Text>
        )}
        
        {/* Problem count for practice tasks - separate line with icon */}
        {task.task_type === 'practice' && task.problem_count && (
          <View style={styles.problemCountContainer}>
            <Ionicons name="calculator-outline" size={14} color="#f59e0b" />
            <Text style={styles.problemCountText}>{task.problem_count} soru</Text>
          </View>
        )}
        
                 {/* Time and duration at the bottom */}
         <View style={styles.taskFooter}>
           <View style={styles.timeContainer}>
             <Ionicons name="time-outline" size={12} color="#6B7280" />
             <Text style={styles.taskStartTime}>
               {task.scheduled_start_time ? task.scheduled_start_time.slice(0, 5) : '--:--'}
             </Text>
           </View>
           <View style={styles.timeContainer}>
             <Ionicons name="timer-outline" size={12} color="#6B7280" />
             <Text style={styles.taskDuration}>
               {task.estimated_duration}dk
             </Text>
           </View>
         </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Connection Status Indicator */}
      <View style={styles.connectionIndicator}>
        <View style={[
          styles.connectionDot, 
          { backgroundColor: realtimeConnected ? '#22c55e' : '#f59e0b' }
        ]} />
        <Text style={styles.connectionText}>
          {realtimeConnected ? 'Canlı bağlantı aktif' : 'Yoklama modu'}
        </Text>
      </View>
      
      {/* Tab Headers */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
            Bugün
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weekly' && styles.activeTab]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.activeTabText]}>
            Haftalık Plan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'monthly' && styles.activeTab]}
          onPress={() => setActiveTab('monthly')}
        >
          <Text style={[styles.tabText, activeTab === 'monthly' && styles.activeTabText]}>
            Aylık Plan
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Today Tab */}
        {activeTab === 'today' && (
          <View style={styles.todayContainer}>
            {/* Today's Stats */}
            {todayTasks.length > 0 && (
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Bugünkü İlerleme</Text>
                <Text style={styles.statsText}>
                  {todayStats.completed}/{todayStats.total} görev tamamlandı
                </Text>
              </View>
            )}

            {/* Today's Tasks */}
            {todayTasks.length === 0 ? (
              <View style={styles.noTasksContainer}>
                <Text style={styles.noTasksTitle}>Bugün görev yok!</Text>
                <Text style={styles.noTasksDescription}>
                  Dinlenme günün. Yarın için hazır ol! 🌟
                </Text>
              </View>
            ) : (
              todayTasks.map(task => renderTaskCard(task))
            )}
          </View>
        )}

        {/* Weekly Plan Tab */}
        {activeTab === 'weekly' && (
          <View style={styles.weeklyContainer}>
            {/* Week Header with Navigation */}
            <View style={styles.weekHeader}>
              <View style={styles.weekNavigation}>
                <TouchableOpacity 
                  style={styles.weekNavButton}
                  onPress={() => navigateWeek('prev')}
                >
                  <Ionicons name="chevron-back" size={20} color="#6B7280" />
                </TouchableOpacity>
                
                <View style={styles.weekInfo}>
                  <Text style={styles.weekTitle}>Haftalık Plan</Text>
                  <Text style={styles.weekDateRange}>{getWeekDateRange()}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.weekNavButton}
                  onPress={() => navigateWeek('next')}
                >
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Görevler yükleniyor...</Text>
              </View>
            ) : (
              <>
                {/* Days and Tasks */}
                {days.map(day => {
                  const dayTasks = getDayTasks(day)
                  const dayStats = getDayStats(day)
                  
                  if (dayTasks.length === 0) return null

                  return (
                    <View key={day} style={styles.dayContainer}>
                      {/* Day Header */}
                      <View style={styles.dayHeader}>
                        <Text style={styles.dayName}>{day}</Text>
                        <View style={styles.dayStatsContainer}>
                          <Text style={styles.dayStats}>
                            {dayStats.completed}/{dayStats.total}
                          </Text>
                        </View>
                      </View>

                      {/* Tasks */}
                      {dayTasks.map(task => renderTaskCard(task))}
                    </View>
                  )
                })}

                {/* No tasks message */}
                {weeklyTasks.length === 0 && (
                  <View style={styles.noTasksContainer}>
                    <Text style={styles.noTasksTitle}>Bu hafta görev yok!</Text>
                    <Text style={styles.noTasksDescription}>
                      Bu hafta için planlanmış görev bulunmuyor.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Monthly Plan Tab */}
        {activeTab === 'monthly' && (
          <View style={styles.monthlyContainer}>
            {/* Month Header with Navigation */}
            <View style={styles.monthHeader}>
              <TouchableOpacity 
                style={styles.monthNavButton}
                onPress={() => navigateMonth('prev')}
              >
                <Ionicons name="chevron-back" size={20} color="#6B7280" />
              </TouchableOpacity>
              
              <Text style={styles.monthTitle}>
                {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
              </Text>
              
              <TouchableOpacity 
                style={styles.monthNavButton}
                onPress={() => navigateMonth('next')}
              >
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarContainer}>
              {/* Days of Week Headers */}
              <View style={styles.calendarHeaderRow}>
                {['Pt', 'S', 'Ç', 'Pe', 'C', 'Ct', 'Pz'].map((day, index) => (
                  <Text key={index} style={styles.calendarDayHeader}>{day}</Text>
                ))}
              </View>

              {/* Calendar Days */}
              <View style={styles.calendarDays}>
                {renderCalendarDays()}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  todayContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsCard: {
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  weeklyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  weekHeader: {
    marginBottom: 16,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekNavButton: {
    padding: 8,
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  weekDateRange: {
    fontSize: 14,
    color: '#6B7280',
  },
     weekOverview: {
     alignItems: 'center',
     marginBottom: 16,
   },
   weekSubtitle: {
     fontSize: 14,
     color: '#6B7280',
   },
  dayContainer: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dayStatsContainer: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dayStats: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  taskContentContainer: {
    marginBottom: 8,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  resourceCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  problemCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  problemCountText: {
    fontSize: 12,
    color: '#f59e0b',
    marginLeft: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskStartTime: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  taskDuration: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  noTasksContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noTasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 16,
    marginBottom: 8,
  },
  noTasksDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  monthlyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  monthlyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  monthlyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthNavButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calendarDayHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  emptyDay: {
    width: '14.28%',
    height: 40,
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  todayCalendarDay: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  calendarDayWithTasks: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  todayCalendarDayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  calendarDayTextWithTasks: {
    color: '#1F2937',
    fontWeight: '600',
  },
  taskIndicator: {
    position: 'absolute',
    bottom: -2,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  taskIndicatorText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
}) 