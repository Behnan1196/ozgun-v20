'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      setDebugInfo(`Authenticated as: ${user.email}`)
      
      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw new Error(`Profile error: ${profileError.message}`)
      }

      if (!profile || profile.role !== 'admin') {
        throw new Error('Access denied: Admin role required')
      }

      setDebugInfo(`Authenticated as admin: ${profile.full_name} (${user.email})`)
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Authentication failed')
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const supabase = createClient()
      console.log('Loading data from Supabase...')

      // Get all assignments with user details
      console.log('Fetching assignments...')
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('coach_student_assignments')
        .select(`
          id,
          is_active,
          assigned_at,
          coach:coach_id(id, full_name, email),
          student:student_id(id, full_name, email)
        `)
        .order('assigned_at', { ascending: false })

      console.log('Assignments result:', { assignmentsData, assignmentsError })

      if (assignmentsError) {
        console.error('Assignments error:', assignmentsError)
        throw new Error(`Assignments: ${assignmentsError.message}`)
      }
      
      setAssignments(assignmentsData || [])

      // Get all users
      console.log('Fetching users...')
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, role')
        .order('role', { ascending: true })

      console.log('Users result:', { usersData, usersError })

      if (usersError) {
        console.error('Users error:', usersError)
        throw new Error(`Users: ${usersError.message}`)
      }
      
      setUsers(usersData || [])
      setDebugInfo(prev => `${prev} | Found ${(assignmentsData || []).length} assignments, ${(usersData || []).length} users`)
    } catch (err: any) {
      console.error('LoadData error:', err)
      setError(err?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug: Coach-Student Assignments</h1>
      
      {debugInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">Debug: {debugInfo}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-gray-800">Loading...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assignments Table */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Current Assignments ({assignments?.length || 0})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Coach</th>
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-left">Active</th>
                  <th className="px-4 py-2 text-left">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {assignments?.map((assignment) => (
                  <tr key={assignment.id} className="border-t">
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium">{(assignment.coach as any)?.full_name || 'Unknown'}</div>
                        <div className="text-gray-500 text-xs">{(assignment.coach as any)?.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <div className="font-medium">{(assignment.student as any)?.full_name || 'Unknown'}</div>
                        <div className="text-gray-500 text-xs">{(assignment.student as any)?.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        assignment.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {assignment.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {new Date(assignment.assigned_at).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
                {(!assignments || assignments.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No assignments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Summary */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">All Users ({users?.length || 0})</h2>
          </div>
          <div className="p-4 space-y-4">
            {['admin', 'coach', 'student'].map(role => {
              const roleUsers = users?.filter(u => u.role === role) || []
              return (
                <div key={role} className="border rounded-lg p-3">
                  <h3 className="font-medium text-sm uppercase text-gray-600 mb-2">
                    {role}s ({roleUsers.length})
                  </h3>
                  <div className="space-y-1">
                    {roleUsers.map(user => (
                      <div key={user.id} className="text-sm">
                        <span className="font-medium">{user.full_name}</span>
                        <span className="text-gray-500 ml-2">{user.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• This page shows all coach-student assignments and users</li>
          <li>• Duplicate assignments (same coach-student pair) will cause constraint violations</li>
          <li>• If you see duplicate assignments, the newer logic should handle them properly</li>
          <li>• Try assigning coaches to students through the main admin panel</li>
        </ul>
      </div>

      <div className="mt-4 text-center">
        <a 
          href="/admin/users" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          ← Back to User Management
        </a>
      </div>
    </div>
  )
} 