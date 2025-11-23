-- Cleanup script for duplicate messages
-- Run this in your Supabase SQL Editor to start fresh

-- STEP 1: Delete all old data (this will cascade delete messages)
DELETE FROM voltagent_memory_conversations;

-- STEP 2: Verify everything is clean
SELECT 'Conversations' as table_name, COUNT(*) as count FROM voltagent_memory_conversations
UNION ALL
SELECT 'Messages' as table_name, COUNT(*) as count FROM voltagent_memory_messages
UNION ALL
SELECT 'Steps' as table_name, COUNT(*) as count FROM voltagent_memory_steps;

-- You should see all counts as 0
-- Now you can start fresh with the fixed implementation!
