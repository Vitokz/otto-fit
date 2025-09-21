-- Делаем поля профиля опциональными для автоматической регистрации
-- Пользователь заполнит их позже через форму

ALTER TABLE user_profiles 
    ALTER COLUMN gender DROP NOT NULL,
    ALTER COLUMN height DROP NOT NULL,
    ALTER COLUMN weight DROP NOT NULL,
    ALTER COLUMN birth_date DROP NOT NULL;

-- Добавляем поле для отслеживания завершенности профиля
ALTER TABLE user_profiles 
    ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;

-- Функция для проверки завершенности профиля
CREATE OR REPLACE FUNCTION check_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completed = (
        NEW.gender IS NOT NULL AND
        NEW.height IS NOT NULL AND
        NEW.weight IS NOT NULL AND
        NEW.birth_date IS NOT NULL
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления статуса завершенности профиля
CREATE TRIGGER update_profile_completion 
    BEFORE INSERT OR UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION check_profile_completion();

-- Обновляем существующие профили
UPDATE user_profiles 
SET profile_completed = (
    gender IS NOT NULL AND
    height IS NOT NULL AND
    weight IS NOT NULL AND
    birth_date IS NOT NULL
);
