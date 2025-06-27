import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { 
  Users, 
  Search, 
  Filter,
  MoreVertical,
  Mail,
  Calendar,
  TrendingUp,
  BookOpen,
  MessageCircle,
  Video,
  ArrowLeft,
  GraduationCap
} from 'lucide-react'

export default async function CoachStudentsPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get coach profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'coach') {
    redirect('/dashboard')
  }

  // Get coach's students with detailed information
  const { data: myStudents } = await supabase
    .from('coach_student_assignments')
    .select(`
      id,
      assigned_at,
      is_active,
      student:student_id(
        id,
        full_name,
        email,
        created_at
      )
    `)
    .eq('coach_id', user.id)
    .eq('is_active', true)
    .order('assigned_at', { ascending: false })

  // Get task statistics for each student
  const studentStats = await Promise.all(
    (myStudents || []).map(async (assignment) => {
      const studentData = assignment.student as any
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('assigned_to', studentData?.id)
        .eq('assigned_by', user.id)

      const totalTasks = tasks?.length || 0
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
      const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0
      const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0

      return {
        studentId: studentData?.id,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/coach" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </a>
              <GraduationCap className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Öğrencilerim</h1>
                <p className="text-sm text-gray-500">Atanmış öğrencileri yönet</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-500">Koç</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Öğrenci Yönetimi
              </h2>
              <p className="text-gray-600 mt-1">
                {myStudents?.length || 0} öğrenci atanmış
              </p>
            </div>
            
            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Öğrenci ara..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filtrele
              </button>
            </div>
          </div>
        </div>

        {myStudents && myStudents.length > 0 ? (
          <>
            {/* Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Öğrenci</p>
                    <p className="text-2xl font-bold text-gray-900">{myStudents.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ortalama Başarı</p>
                    <p className="text-2xl font-bold text-green-600">
                      {studentStats.length > 0 
                        ? Math.round(studentStats.reduce((acc, stat) => acc + stat.completionRate, 0) / studentStats.length)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Görev</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {studentStats.reduce((acc, stat) => acc + stat.totalTasks, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myStudents.map((assignment) => {
                const studentData = assignment.student as any
                const stats = studentStats.find(s => s.studentId === studentData?.id) || {
                  totalTasks: 0,
                  completedTasks: 0,
                  pendingTasks: 0,
                  inProgressTasks: 0,
                  completionRate: 0
                }

                return (
                  <div key={assignment.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Student Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-lg">
                              {studentData?.full_name?.charAt(0) || 'Ö'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-900">
                              {studentData?.full_name || 'İsimsiz Öğrenci'}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {studentData?.email}
                            </p>
                          </div>
                        </div>
                        
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>

                      {/* Progress Stats */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">Görev Başarısı</span>
                          <span className="text-sm font-bold text-blue-600">{stats.completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${stats.completionRate}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Task Statistics */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{stats.totalTasks}</p>
                          <p className="text-xs text-gray-500">Toplam</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{stats.completedTasks}</p>
                          <p className="text-xs text-gray-500">Tamamlandı</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-yellow-600">{stats.pendingTasks}</p>
                          <p className="text-xs text-gray-500">Bekliyor</p>
                        </div>
                      </div>

                      {/* Assignment Date */}
                      <div className="flex items-center text-xs text-gray-500 mb-4">
                        <Calendar className="h-3 w-3 mr-1" />
                        Atama: {new Date(assignment.assigned_at).toLocaleDateString('tr-TR')}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <a
                          href={`/coach/students/${studentData?.id}`}
                          className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                          Detaylar
                        </a>
                        <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                          <MessageCircle className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                          <Video className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <Users className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Henüz öğrenci atanmamış</h3>
            <p className="text-gray-500 mb-8">
              Admin tarafından size öğrenci atandığında burada görünecekler.
            </p>
            <div className="flex justify-center">
              <a
                href="/coach"
                className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
              >
                Dashboard'a Dön
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 