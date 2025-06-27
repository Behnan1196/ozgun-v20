'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/types/database'

interface CreateUserData {
  email: string
  full_name: string
  role: UserRole
  password: string
  assigned_coach_id?: string
}

interface UpdateUserData {
  id: string
  email: string
  full_name: string
  role: UserRole
  assigned_coach_id?: string
}

export async function createUser(userData: CreateUserData) {
  try {
    // Check if current user is admin
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    // Use admin client to create user
    const adminSupabase = createAdminClient()
    
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    })

    if (authError) throw authError

    if (authData.user) {
      // Create user profile
      const { error: profileError } = await adminSupabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
        })

      if (profileError) throw profileError

      // If creating a student and coach is assigned, create the assignment
      if (userData.role === 'student' && userData.assigned_coach_id) {
        const { error: assignmentError } = await adminSupabase
          .from('coach_student_assignments')
          .insert({
            coach_id: userData.assigned_coach_id,
            student_id: authData.user.id,
            is_active: true,
          })

        if (assignmentError) throw assignmentError
      }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateUser(userData: UpdateUserData) {
  try {
    // Check if current user is admin
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    // Use admin client to update user
    const adminSupabase = createAdminClient()
    
    const { error } = await adminSupabase
      .from('user_profiles')
      .update({
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
      })
      .eq('id', userData.id)

    if (error) throw error

    // Handle coach-student assignment for students
    if (userData.role === 'student') {
      // First, deactivate ALL existing assignments for this student
      await adminSupabase
        .from('coach_student_assignments')
        .update({ is_active: false })
        .eq('student_id', userData.id)

      // If a coach is assigned, create or reactivate assignment
      if (userData.assigned_coach_id) {
        // Check if assignment already exists
        const { data: existingAssignment } = await adminSupabase
          .from('coach_student_assignments')
          .select('id')
          .eq('coach_id', userData.assigned_coach_id)
          .eq('student_id', userData.id)
          .single()

        if (existingAssignment) {
          // Reactivate existing assignment
          const { error: updateError } = await adminSupabase
            .from('coach_student_assignments')
            .update({ is_active: true })
            .eq('id', existingAssignment.id)

          if (updateError) throw updateError
        } else {
          // Create new assignment
          const { error: assignmentError } = await adminSupabase
            .from('coach_student_assignments')
            .insert({
              coach_id: userData.assigned_coach_id,
              student_id: userData.id,
              is_active: true,
            })

          if (assignmentError) throw assignmentError
        }
      }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteUser(userId: string) {
  try {
    // Check if current user is admin
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    // Use admin client to delete user
    const adminSupabase = createAdminClient()
    
    const { error } = await adminSupabase.auth.admin.deleteUser(userId)
    
    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
} 