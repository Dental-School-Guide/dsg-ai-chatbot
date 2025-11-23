-- Debug query to check if context_id exists in context_links table
-- Run this in Supabase SQL Editor

-- Check if the specific context_id exists in context_links
SELECT * FROM context_links 
WHERE id = '3449f7a4-b839-4f42-a81f-4e24f1b8ea4c';

-- If the above returns no results, check what IDs actually exist in context_links
SELECT id, context_name, link FROM context_links LIMIT 10;

-- Check what context_ids are in context_embeddings
SELECT DISTINCT context_id FROM context_embeddings LIMIT 10;

-- Find embeddings that don't have matching context_links
SELECT DISTINCT ce.context_id 
FROM context_embeddings ce
LEFT JOIN context_links cl ON ce.context_id = cl.id
WHERE cl.id IS NULL
LIMIT 10;
