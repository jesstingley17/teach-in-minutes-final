-- Create parsed_curriculums table to store parsed curriculum documents
CREATE TABLE IF NOT EXISTS parsed_curriculums (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'text' or 'file'
    source_data TEXT, -- For text: the raw text. For file: file name or reference
    nodes JSONB NOT NULL, -- Array of CurriculumNode objects
    file_name TEXT, -- Original file name if uploaded
    file_type TEXT, -- MIME type if uploaded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS parsed_curriculums_user_id_idx ON parsed_curriculums(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS parsed_curriculums_created_at_idx ON parsed_curriculums(created_at DESC);

-- Enable Row Level Security
ALTER TABLE parsed_curriculums ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own parsed curriculums
CREATE POLICY "Users can view their own parsed curriculums"
ON parsed_curriculums FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own parsed curriculums
CREATE POLICY "Users can insert their own parsed curriculums"
ON parsed_curriculums FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own parsed curriculums
CREATE POLICY "Users can update their own parsed curriculums"
ON parsed_curriculums FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own parsed curriculums
CREATE POLICY "Users can delete their own parsed curriculums"
ON parsed_curriculums FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_parsed_curriculums_updated_at
    BEFORE UPDATE ON parsed_curriculums
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

