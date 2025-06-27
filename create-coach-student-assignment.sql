-- Create coach-student assignment for testing Stream.io chat
-- This will link the coach (Behnan) with the student (Filiz) so they can chat

INSERT INTO coach_student_assignments (
  coach_id,
  student_id,
  assigned_at,
  is_active
) VALUES (
  'f36120eb-0493-4f87-a704-776c035b2942', -- Coach (Behnan)
  'b5a31f59-6e55-460d-9276-d48e5cadb80b', -- Student (Filiz)
  NOW(),
  true
)
ON CONFLICT (coach_id, student_id) 
DO UPDATE SET 
  is_active = true,
  assigned_at = NOW();

-- Verify the assignment was created
SELECT 
  csa.*,
  coach.full_name as coach_name,
  student.full_name as student_name
FROM coach_student_assignments csa
JOIN user_profiles coach ON coach.id = csa.coach_id
JOIN user_profiles student ON student.id = csa.student_id
WHERE csa.is_active = true; 