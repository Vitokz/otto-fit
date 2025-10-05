-- Create exercises table
CREATE TABLE
    metcon_exercises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        category_id UUID NOT NULL REFERENCES activity_categories (id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        logo_url TEXT,
        description TEXT NOT NULL,
        measure_unit_id UUID NOT NULL REFERENCES measurement_units (id) ON DELETE RESTRICT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL
    );

-- Create index for category_id for efficient lookups
CREATE INDEX idx_metcon_exercises_category_id ON metcon_exercises (category_id);

-- Create unique index for name within category to prevent duplicates
CREATE UNIQUE INDEX idx_metcon_exercises_category_name ON metcon_exercises (category_id, name);

-- Create metcon_exercise_records table
CREATE TABLE
    metcon_exercise_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        metcon_exercise_id UUID NOT NULL REFERENCES metcon_exercises (id) ON DELETE CASCADE,
        user_id bigint NOT NULL REFERENCES user_profiles (telegram_id) ON DELETE CASCADE,
        measure_unit_id UUID NOT NULL REFERENCES measurement_units (id) ON DELETE RESTRICT,
        value DECIMAL(10, 2) NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('current', 'previous')),
        previoused_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL
    );

-- Create indexes for metcon_exercise_records
CREATE INDEX idx_metcon_exercise_records_exercise_id ON metcon_exercise_records (metcon_exercise_id);

CREATE INDEX idx_metcon_exercise_records_user_id ON metcon_exercise_records (user_id);

CREATE INDEX idx_metcon_exercise_records_state ON metcon_exercise_records (state);

CREATE INDEX idx_metcon_exercise_records_user_exercise ON metcon_exercise_records (user_id, metcon_exercise_id);