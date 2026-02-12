-- Add social_profiles column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'social_profiles') THEN
        ALTER TABLE profiles ADD COLUMN social_profiles JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
