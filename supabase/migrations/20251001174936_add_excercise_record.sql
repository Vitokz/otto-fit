-- Create exercise_records table
CREATE TABLE
    exercise_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        exercise_id UUID NOT NULL REFERENCES exercises (id) ON DELETE CASCADE,
        user_id bigint NOT NULL REFERENCES user_profiles (telegram_id) ON DELETE CASCADE,
        measure_unit_id UUID NOT NULL REFERENCES measurement_units (id) ON DELETE RESTRICT,
        name TEXT NOT NULL,
        value DECIMAL(10, 2) NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('current', 'previous')),
        previoused_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL
    );

-- Create indexes for exercise_records
CREATE INDEX idx_exercise_records_exercise_id ON exercise_records (exercise_id);

CREATE INDEX idx_exercise_records_user_id ON exercise_records (user_id);

CREATE INDEX idx_exercise_records_state ON exercise_records (state);

CREATE INDEX idx_exercise_records_user_exercise ON exercise_records (user_id, exercise_id);

-- Create unique index to ensure only one current record per user per exercise
CREATE UNIQUE INDEX idx_exercise_records_user_exercise_current ON exercise_records (user_id, exercise_id)
WHERE
    state = 'current';