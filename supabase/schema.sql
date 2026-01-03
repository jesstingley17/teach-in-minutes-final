-- Create instructional_suites table
CREATE TABLE IF NOT EXISTS instructional_suites (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    title TEXT NOT NULL,
    sections JSONB NOT NULL,
    output_type TEXT NOT NULL,
    bloom_level TEXT NOT NULL,
    differentiation TEXT NOT NULL,
    aesthetic TEXT NOT NULL,
    institution_name TEXT,
    instructor_name TEXT,
    doodle_base64 TEXT,
    doodle_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS instructional_suites_user_id_idx ON instructional_suites(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS instructional_suites_created_at_idx ON instructional_suites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE instructional_suites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own suites (or anonymous users can view all)
CREATE POLICY "Users can view their own suites or anonymous can view all"
ON instructional_suites FOR SELECT
USING (
    auth.uid() = user_id OR user_id IS NULL
);

-- Policy: Users can insert their own suites
CREATE POLICY "Users can insert their own suites"
ON instructional_suites FOR INSERT
WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
);

-- Policy: Users can update their own suites
CREATE POLICY "Users can update their own suites"
ON instructional_suites FOR UPDATE
USING (
    auth.uid() = user_id OR user_id IS NULL
);

-- Policy: Users can delete their own suites
CREATE POLICY "Users can delete their own suites"
ON instructional_suites FOR DELETE
USING (
    auth.uid() = user_id OR user_id IS NULL
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_instructional_suites_updated_at
    BEFORE UPDATE ON instructional_suites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
