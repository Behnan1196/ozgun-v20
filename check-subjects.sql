-- Check existing subjects in the database
SELECT id, name, created_at 
FROM subjects 
ORDER BY name;

-- Also check if there are any topics currently
SELECT COUNT(*) as total_topics FROM topics;

-- Check subjects with their current topic counts
SELECT 
    s.id,
    s.name as subject_name,
    COUNT(t.id) as current_topic_count
FROM subjects s
LEFT JOIN topics t ON s.id = t.subject_id
GROUP BY s.id, s.name
ORDER BY s.name; 