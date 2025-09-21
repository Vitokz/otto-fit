# Настройка автоматической авторизации через Telegram

## Обзор решения

Реализована безопасная автоматическая авторизация для Telegram Mini App с использованием:

1. **Верификация Telegram initData** - проверяем криптографическую подпись на сервере
2. **Автоматическое создание пользователей** - новые пользователи создаются автоматически
3. **Управление профилями** - автоматическое перенаправление на заполнение данных
4. **Безопасные сессии** - используем Supabase JWT токены

## Настройка

### 1. Переменные окружения

Создайте файл `.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Для Edge Function (в Supabase Dashboard -> Edge Functions -> Settings)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Применение миграций

```bash
# Применить новые миграции
supabase db push

# Или если используете локальную разработку
supabase migration up
```

### 3. Деплой Edge Function

```bash
# Деплой функции авторизации
supabase functions deploy telegram-auth

# Установка переменных окружения для функции
supabase secrets set TELEGRAM_BOT_TOKEN=your-bot-token
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Настройка Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите токен бота
3. Настройте Mini App через `/setmenubutton` или `/newapp`

## Как это работает

### Пользовательский флоу

1. **Открытие Mini App** - пользователь открывает приложение в Telegram
2. **Автоматическая авторизация** - приложение автоматически авторизует пользователя
3. **Проверка профиля** - если профиль неполный, перенаправляет на форму
4. **Заполнение данных** - пользователь заполняет недостающие данные
5. **Главный экран** - пользователь видит свои данные

### Техническая реализация

```typescript
// 1. Получение Telegram данных
const { webApp } = useTelegram()
const initData = webApp.value?.initData

// 2. Отправка на сервер для верификации
const result = await authStore.signInWithTelegram(initData)

// 3. Автоматическое создание пользователя (если новый)
// 4. Установка сессии в Supabase
// 5. Перенаправление по необходимости
```

## Безопасность

### Верификация initData

```typescript
// Проверка подписи Telegram (только на сервере!)
function verifyTelegramInitData(initData: string, botToken: string): boolean {
  const urlParams = new URLSearchParams(initData)
  const hash = urlParams.get('hash')
  
  // Создаем секретный ключ
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  
  // Проверяем подпись
  const calculatedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')
    
  return calculatedHash === hash
}
```

### Защита от атак

- ✅ **Подпись проверяется на сервере** - клиент не может подделать данные
- ✅ **Временные ограничения** - данные действительны 24 часа
- ✅ **Row Level Security** - пользователи видят только свои данные
- ✅ **HTTPS только** - все запросы защищены

## Структура базы данных

```sql
-- Профили пользователей
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    username TEXT,
    gender TEXT,                    -- Опционально
    height INTEGER,                 -- Опционально
    weight DECIMAL(5,2),           -- Опционально
    birth_date DATE,               -- Опционально
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Отладка

### Проверка авторизации

```javascript
// В браузере (DevTools)
console.log('Auth Store:', useAuthStore())
console.log('Telegram WebApp:', window.Telegram?.WebApp)
```

### Логи Edge Function

```bash
# Просмотр логов функции
supabase functions logs telegram-auth
```

### Mock режим для тестирования

```javascript
// Добавьте в URL для тестирования
?mock=true&user=test&theme=light
```

## Возможные проблемы

1. **Функция не деплоится** - проверьте переменные окружения
2. **Авторизация не работает** - проверьте токен бота
3. **Перенаправления не работают** - проверьте router guards
4. **RLS ошибки** - проверьте политики безопасности

## Масштабирование

Для продакшена рекомендуется:

- Использовать CDN для статических файлов
- Настроить мониторинг Edge Functions
- Добавить rate limiting
- Логирование всех авторизаций
