import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, completed_at, problem_count, estimated_duration } = await request.json()
    const taskId = params.id

    // Get the current user
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get the task to check permissions and task type
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('assigned_to, assigned_by, task_type')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Permission check: coaches can update any task assigned to their students, students can update tasks assigned to them
    let canUpdate = false
    
    if (profile.role === 'coach' || profile.role === 'coordinator') {
      // Check if this task is assigned to one of the coach's students
      const { data: assignment } = await supabase
        .from('coach_student_assignments')
        .select('student_id')
        .eq('coach_id', user.id)
        .eq('student_id', task.assigned_to)
        .eq('is_active', true)
        .single()
      
      canUpdate = !!assignment
    } else {
      // Students can only update tasks assigned to them
      canUpdate = task.assigned_to === user.id
    }

    if (!canUpdate) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Validate problem_count if provided
    if (problem_count !== undefined) {
      // Only allow problem_count updates for specific task types
      const allowedTaskTypes = ['practice', 'study', 'review']
      if (!allowedTaskTypes.includes(task.task_type)) {
        return NextResponse.json({ 
          error: 'Problem count can only be updated for practice, study, and review tasks' 
        }, { status: 400 })
      }
      
      // Validate problem_count is a non-negative integer
      if (typeof problem_count !== 'number' || problem_count < 0 || !Number.isInteger(problem_count)) {
        return NextResponse.json({ 
          error: 'Problem count must be a non-negative integer' 
        }, { status: 400 })
      }
    }

    // Validate estimated_duration if provided
    if (estimated_duration !== undefined) {
      // Validate estimated_duration is a positive integer
      if (typeof estimated_duration !== 'number' || estimated_duration <= 0 || !Number.isInteger(estimated_duration)) {
        return NextResponse.json({ 
          error: 'Duration must be a positive integer' 
        }, { status: 400 })
      }
    }

    // Use admin client to bypass RLS for authorized updates
    const adminSupabase = createAdminClient()
    
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (status !== undefined) {
      updateData.status = status
    }
    
    if (completed_at !== undefined) {
      updateData.completed_at = completed_at
    }
    
    if (problem_count !== undefined) {
      updateData.problem_count = problem_count
    }
    
    if (estimated_duration !== undefined) {
      updateData.estimated_duration = estimated_duration
    }
    
    const { data: updatedTask, error: updateError } = await adminSupabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('Task update error:', updateError)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    return NextResponse.json({ task: updatedTask }, { status: 200 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 