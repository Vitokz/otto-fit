-- Создание таблицы профилей пользователей
CREATE TABLE user_profiles (
    telegram_id BIGINT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    username TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')) NOT NULL,
    height INTEGER CHECK (height >= 120 AND height <= 250) NOT NULL,
    weight DECIMAL(5,2) CHECK (weight >= 30 AND weight <= 300) NOT NULL,
    birth_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для быстрого поиска
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Отключаем Row Level Security, так как используем только telegram_id без auth.users
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
