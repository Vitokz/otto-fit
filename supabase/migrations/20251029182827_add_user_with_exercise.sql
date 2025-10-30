-- Create exercises table
CREATE TABLE
    user_with_exercise_work (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id bigint NOT NULL REFERENCES user_profiles (telegram_id) ON DELETE CASCADE,
        exercise_id UUID REFERENCES exercises (id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL
    );

-- Create indexes for user_with_exercise_work
CREATE INDEX idx_user_with_exercise_work_user_id ON user_with_exercise_work (user_id);