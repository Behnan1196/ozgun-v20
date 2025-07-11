// Database types for TYT AYT Coaching System V3.0
export type UserRole = 'admin' | 'coach' | 'student' | 'coordinator'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskType = 'study' | 'practice' | 'exam' | 'review' | 'resource' | 'coaching_session'
export type ResourceCategory = 'video' | 'document' | 'pdf' | 'application'
export type DifficultyLevel = 'baslangic' | 'orta' | 'ileri' | 'uzman'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface CoachStudentAssignment {
  id: string
  coach_id: string
  student_id: string
  assigned_at: string
  is_active: boolean
}

export interface Subject {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
}

export interface Topic {
  id: string
  subject_id: string
  name: string
  description?: string
  order_index: number
  is_active: boolean
  created_at: string
}

export interface Resource {
  id: string
  name: string
  description?: string
  url: string
  category: ResourceCategory
  subject_id?: string
  created_by: string
  is_active: boolean
  created_at: string
  difficulty_level?: DifficultyLevel
}

export interface MockExam {
  id: string
  name: string
  description?: string
  subject_id?: string
  difficulty_level?: DifficultyLevel
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  subject_id?: string
  topic_id?: string
  resource_id?: string
  mock_exam_id?: string
  assigned_by: string
  assigned_to: string
  status: TaskStatus
  task_type: TaskType
  scheduled_date?: string
  scheduled_start_time?: string
  scheduled_end_time?: string
  estimated_duration?: number
  problem_count?: number
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at?: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  created_by: string
  is_active: boolean
  created_at: string
}

export interface StreamToken {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
}

export interface DeviceToken {
  id: string
  user_id: string
  token: string
  platform: 'ios' | 'android'
  updated_at: string
  created_at: string
}

// Extended types with relations
export interface UserProfileWithStats extends UserProfile {
  task_count?: number
  completed_tasks?: number
  active_assignments?: number
}

export interface SubjectWithTopics extends Subject {
  topics?: Topic[]
  resource_count?: number
}

export interface TaskWithRelations extends Task {
  subject?: Subject
  topic?: Topic
  assigned_by_user?: UserProfile
  assigned_to_user?: UserProfile
}

export interface MockExamWithRelations extends MockExam {
  subject?: Subject
  created_by_user?: UserProfile
} 