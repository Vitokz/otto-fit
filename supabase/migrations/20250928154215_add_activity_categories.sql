-- Create activity_categories table
CREATE TABLE activity_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for sorting
CREATE INDEX idx_activity_categories_sort_order ON activity_categories(sort_order);

-- Create unique index for name to prevent duplicates
CREATE UNIQUE INDEX idx_activity_categories_name ON activity_categories(name);
