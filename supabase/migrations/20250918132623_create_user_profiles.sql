-- Создание таблицы профилей пользователей
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
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
CREATE INDEX idx_user_profiles_telegram_id ON user_profiles(telegram_id);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Включение Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Политики безопасности: пользователи могут видеть и изменять только свои данные
CREATE POLICY "Users can view their own profile" 
    ON user_profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
    ON user_profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

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
