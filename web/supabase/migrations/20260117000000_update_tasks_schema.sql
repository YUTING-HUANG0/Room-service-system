-- Rename photo_url to image_url in tasks table if it exists
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='photo_url') THEN
    ALTER TABLE public.tasks RENAME COLUMN photo_url TO image_url;
  ELSE
    -- If image_url does not exist, add it (just in case)
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='image_url') THEN
       ALTER TABLE public.tasks ADD COLUMN image_url text;
    END IF;
  END IF;
END $$;

-- Create tasks storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tasks', 'tasks', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for tasks bucket
-- 1. Public Access (Read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to Tasks Images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public Access to Tasks Images"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'tasks' );
  END IF;
END $$;

-- 2. Authenticated Upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload task images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Authenticated users can upload task images"
    ON storage.objects FOR INSERT
    WITH CHECK ( bucket_id = 'tasks' AND auth.role() = 'authenticated' );
  END IF;
END $$;
