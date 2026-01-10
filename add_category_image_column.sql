-- Add image_url column to categories table
-- This migration adds support for category images

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN categories.image_url IS 'URL of the category image';
