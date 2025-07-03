-- Create the enum type for difficulty levels
CREATE TYPE difficulty_level AS ENUM ('baslangic', 'orta', 'ileri', 'uzman');

-- Add the difficulty_level column to the resources table
ALTER TABLE resources
ADD COLUMN difficulty_level difficulty_level DEFAULT NULL;

-- Add a comment to the column
COMMENT ON COLUMN resources.difficulty_level IS 'Kaynağın zorluk seviyesi: başlangıç, orta, ileri veya uzman';

-- Create an index for faster filtering and sorting
CREATE INDEX idx_resources_difficulty_level ON resources(difficulty_level); 