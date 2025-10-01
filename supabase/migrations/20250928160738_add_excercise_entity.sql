-- Create exercises table
CREATE TABLE
    exercises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        category_id UUID NOT NULL REFERENCES activity_categories (id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        logo_url TEXT,
        description TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL
    );

-- Create index for category_id for efficient lookups
CREATE INDEX idx_exercises_category_id ON exercises (category_id);

-- Create unique index for name within category to prevent duplicates
CREATE UNIQUE INDEX idx_exercises_category_name ON exercises (category_id, name);

-- Create measurement_units table
CREATE TABLE
    measurement_units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL
    );

-- Create unique index for measurement unit name to prevent duplicates
CREATE UNIQUE INDEX idx_measurement_units_name ON measurement_units (name);