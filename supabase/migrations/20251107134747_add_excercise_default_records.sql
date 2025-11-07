-- Create exercise_records table
CREATE TABLE
    exercise_default_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        exercise_id UUID NOT NULL REFERENCES exercises (id) ON DELETE CASCADE,
        measure_unit_id UUID NOT NULL REFERENCES measurement_units (id) ON DELETE RESTRICT,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL
    );

ALTER TABLE exercise_records
ADD COLUMN default_record_id UUID REFERENCES exercise_default_records (id) ON DELETE RESTRICT;

-- Create indexes for exercise_default_records
CREATE INDEX idx_exercise_default_records_exercise_id ON exercise_default_records (exercise_id);

CREATE INDEX idx_exercise_default_records_name ON exercise_default_records (name);