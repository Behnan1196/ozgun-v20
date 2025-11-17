import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/notifications/test-direct - Direct test without any filters
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // Get all students
    const { data: allStudents, error: studentsError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role')
      .eq('role', 'student')

    // Get today's tasks
    const { data: todayTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, assigned_to, status, scheduled_date, title')
      .eq('scheduled_date', today)

    // Manual join
    const studentsWithTasks = (allStudents || []).map((student: any) => {
      const studentTasks = (todayTasks || []).filter((task: any) => task.assigned_to === student.id)
      const incompleteTasks = studentTasks.filter((task: any) => task.status !== 'completed')
      
      return {
        student_id: student.id,
        student_name: student.full_name,
        total_tasks: studentTasks.length,
        incomplete_tasks: incompleteTasks.length,
        tasks: studentTasks
      }
    })

    return NextResponse.json({
      success: true,
      today,
      total_students: allStudents?.length || 0,
      total_tasks_today: todayTasks?.length || 0,
      students_with_tasks: studentsWithTasks.filter(s => s.total_tasks > 0),
      students_with_incomplete: studentsWithTasks.filter(s => s.incomplete_tasks > 0),
      errors: {
        studentsError,
        tasksError
      }
    })

  } catch (error) {
    console.error('Error in test-direct:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 })
  }
}
