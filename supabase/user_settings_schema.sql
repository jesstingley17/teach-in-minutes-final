-- Create user_settings table to store user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    institution_name TEXT,
    instructor_name TEXT,
    default_output_type TEXT,
    default_grade_level TEXT,
    default_standards_framework TEXT,
    default_bloom_level TEXT,
    default_differentiation TEXT,
    default_aesthetic TEXT,
    default_page_count INTEGER DEFAULT 1,
    hide_branding_section BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id (already primary key, but explicit index for clarity)
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own settings
CREATE POLICY "Users can view their own settings"
ON user_settings FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
ON user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update their own settings"
ON user_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

