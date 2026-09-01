-- ============================================
-- Supabase SQL Script to Fix RLS Policies for stock_in Table
-- ============================================
-- This script fixes the Row Level Security (RLS) error:
-- "new row violates row-level security policy for table 'stock_in'"
-- ============================================

-- 1. Enable RLS on stock_in table (if not already enabled)
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (if they exist)
DROP POLICY IF EXISTS "Users can view their own stock_in records" ON stock_in;
DROP POLICY IF EXISTS "Users can insert their own stock_in records" ON stock_in;
DROP POLICY IF EXISTS "Users can update their own stock_in records" ON stock_in;
DROP POLICY IF EXISTS "Users can delete their own stock_in records" ON stock_in;

-- 3. Create SELECT policy - Users can only view their own records
CREATE POLICY "Users can view their own stock_in records"
ON stock_in
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Create INSERT policy - Users can only insert records with their own user_id
CREATE POLICY "Users can insert their own stock_in records"
ON stock_in
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Create UPDATE policy - Users can only update their own records
CREATE POLICY "Users can update their own stock_in records"
ON stock_in
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Create DELETE policy - Users can only delete their own records
CREATE POLICY "Users can delete their own stock_in records"
ON stock_in
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- Optional: Ensure user_id column exists and has proper constraints
-- ============================================

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stock_in'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE stock_in ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- ============================================
-- Verification Queries (Run these to verify the policies are working)
-- ============================================

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'stock_in';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'stock_in';

-- ============================================
-- Notes:
-- 1. Run this script in Supabase SQL Editor
-- 2. Make sure your app includes user_id in the insert payload
-- 3. The user_id should come from supabase.auth.getUser()
-- ============================================
