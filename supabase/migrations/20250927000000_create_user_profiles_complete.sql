-- Создание таблицы профилей пользователей со всеми настройками
-- Объединенная миграция включающая создание таблицы, настройки RLS и все необходимые функции
-- Создание таблицы профилей пользователей
CREATE TABLE
    user_profiles (
        telegram_id BIGINT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        username TEXT,
        gender TEXT CHECK (gender IN ('male', 'female')),
        height INTEGER CHECK (
            height >= 120
            AND height <= 250
        ),
        weight DECIMAL(5, 2) CHECK (
            weight >= 30
            AND weight <= 300
        ),
        birth_date DATE,
        profile_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW (),
            updated_at TIMESTAMP
        WITH
            TIME ZONE DEFAULT NOW ()
    );

-- Создание индексов для быстрого поиска
CREATE INDEX idx_user_profiles_created_at ON user_profiles (created_at);

-- Отключаем Row Level Security, так как используем только telegram_id без auth.users
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;