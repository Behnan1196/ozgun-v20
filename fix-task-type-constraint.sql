-- Fix task_type constraint to include 'resource'
-- Run this in Supabase SQL editor

-- Drop the existing constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;

-- Add the new constraint with 'resource' included
ALTER TABLE tasks ADD CONSTRAINT tasks_task_type_check CHECK (task_type IN ('study', 'practice', 'exam', 'review', 'resource')); 