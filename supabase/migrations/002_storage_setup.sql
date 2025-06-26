-- Create storage bucket for data imports
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to uploads bucket" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Policy 2: Allow public access to download files (since bucket is public)
CREATE POLICY "Allow public downloads from uploads bucket" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'uploads');

-- Policy 3: Allow authenticated users to delete files they can access
-- You might want to restrict this further to only allow users to delete files from their org
CREATE POLICY "Allow authenticated deletions from uploads bucket" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'uploads');

-- Policy 4: Allow authenticated users to update file metadata
CREATE POLICY "Allow authenticated updates to uploads bucket" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');

-- Optional: Create a more restrictive policy for org-based access
-- This would require you to include orgId in the file path and validate it
-- 
-- CREATE POLICY "Users can only access their org files" ON storage.objects
-- FOR ALL TO authenticated
-- USING (
--   bucket_id = 'uploads' 
--   AND (storage.foldername(name))[1] = (
--     SELECT org_id FROM org_users 
--     WHERE user_id = auth.uid() 
--     LIMIT 1
--   )
-- );

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.buckets TO authenticated; 