-- Disable RLS on Voltagent memory tables
-- These tables are managed by Voltagent with service role key
-- RLS should be disabled to avoid conflicts

-- Disable RLS on all Voltagent memory tables
ALTER TABLE voltagent_memory_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE voltagent_memory_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE voltagent_memory_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE voltagent_memory_workflow_states DISABLE ROW LEVEL SECURITY;
ALTER TABLE voltagent_memory_steps DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies (if any)
DROP POLICY IF EXISTS "Users can view their own conversations" ON voltagent_memory_conversations;
DROP POLICY IF EXISTS "Users can view their own messages" ON voltagent_memory_messages;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON voltagent_memory_conversations;
DROP POLICY IF EXISTS "Users can insert their own messages" ON voltagent_memory_messages;
