-- Create exercise_comments table
CREATE TABLE
    exercise_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        exercise_id UUID NOT NULL REFERENCES exercises (id) ON DELETE CASCADE,
        user_id bigint NOT NULL REFERENCES user_profiles (telegram_id) ON DELETE CASCADE,
        short_name TEXT NOT NULL,
        description TEXT,
        state TEXT NOT NULL CHECK (state IN ('active', 'completed', 'deleted')),
        finished_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE ('utc'::text, NOW()) NOT NULL
    );

-- Create indexes for exercise_comments
CREATE INDEX idx_exercise_comments_exercise_id ON exercise_comments (exercise_id);

CREATE INDEX idx_exercise_comments_user_id ON exercise_comments (user_id);

CREATE INDEX idx_exercise_comments_state ON exercise_comments (state);

CREATE INDEX idx_exercise_comments_user_exercise ON exercise_comments (user_id, exercise_id);