-- Migration: Add deneme_analizi to task_type enum
-- This updates the check constraint to include the new deneme_analizi task type

-- Drop the existing check constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;

-- Add the updated check constraint with deneme_analizi included
ALTER TABLE tasks ADD CONSTRAINT tasks_task_type_check 
CHECK (task_type IN ('study', 'practice', 'exam', 'review', 'resource', 'coaching_session', 'deneme_analizi'));

-- Verify the constraint was added correctly (updated for newer PostgreSQL)
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'tasks'::regclass AND conname = 'tasks_task_type_check';

