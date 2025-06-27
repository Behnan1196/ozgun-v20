-- Debug coach-student assignments
-- This will help us see what's in the database and troubleshoot the chat loading issue

-- 1. Check all user profiles
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM user_profiles 
WHERE role IN ('coach', 'student')
ORDER BY role, full_name;

-- 2. Check coach-student assignments
SELECT 
  csa.*,
  coach.full_name as coach_name,
  coach.email as coach_email,
  student.full_name as student_name,
  student.email as student_email
FROM coach_student_assignments csa
LEFT JOIN user_profiles coach ON coach.id = csa.coach_id
LEFT JOIN user_profiles student ON student.id = csa.student_id
ORDER BY csa.assigned_at DESC;

-- 3. Check specific assignment for the users we saw in logs
SELECT 
  csa.*,
  coach.full_name as coach_name,
  student.full_name as student_name
FROM coach_student_assignments csa
JOIN user_profiles coach ON coach.id = csa.coach_id
JOIN user_profiles student ON student.id = csa.student_id
WHERE csa.coach_id = 'f36120eb-0493-4f87-a704-776c035b2942' 
   OR csa.student_id = 'b5a31f59-6e55-460d-9276-d48e5cadb80b';

-- 4. If no assignment exists, create it
INSERT INTO coach_student_assignments (
  coach_id,
  student_id,
  assigned_at,
  is_active
) 
SELECT 
  'f36120eb-0493-4f87-a704-776c035b2942', -- Coach (Behnan)
  'b5a31f59-6e55-460d-9276-d48e5cadb80b', -- Student (Filiz)
  NOW(),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM coach_student_assignments 
  WHERE coach_id = 'f36120eb-0493-4f87-a704-776c035b2942' 
    AND student_id = 'b5a31f59-6e55-460d-9276-d48e5cadb80b'
);

-- 5. Final verification
SELECT 
  'Assignment Status' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN 'EXISTS - Chat should work!' 
    ELSE 'MISSING - This is the problem!' 
  END as status
FROM coach_student_assignments csa
WHERE csa.coach_id = 'f36120eb-0493-4f87-a704-776c035b2942' 
  AND csa.student_id = 'b5a31f59-6e55-460d-9276-d48e5cadb80b'
  AND csa.is_active = true; 