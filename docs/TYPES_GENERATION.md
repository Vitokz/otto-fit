# Генерация TypeScript типов из Supabase

## Автоматическая генерация типов

### Из удаленной базы данных:
```bash
# Установи переменную окружения с ID проекта
export SUPABASE_PROJECT_ID=your-project-id

# Генерируй типы
npm run types:generate:remote
```

### Из локальной базы данных:
```bash
# Запусти локальный Supabase
supabase start

# Генерируй типы
npm run types:generate
```

### Ручная команда:
```bash
# Для удаленной базы
supabase gen types typescript --project-id your-project-id > src/types/database.types.ts

# Для локальной базы
supabase gen types typescript --local > src/types/database.types.ts
```

## Использование типов в коде

### В Supabase клиенте:
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const supabase = createClient<Database>(url, key)
```

### Извлечение типов таблиц:
```typescript
// Тип строки таблицы (для чтения)
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

// Тип для вставки (некоторые поля опциональны)
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']

// Тип для обновления (все поля опциональны)
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
```

### В запросах:
```typescript
// Автокомплит и типизация
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('telegram_id', 123)

// data будет иметь тип UserProfile[] | null
```

## Преимущества типизации

✅ **Автокомплит** - IDE предлагает доступные поля и методы  
✅ **Проверка типов** - ошибки обнаруживаются на этапе компиляции  
✅ **Рефакторинг** - безопасное переименование полей  
✅ **Документация** - типы служат живой документацией схемы  
✅ **Синхронизация** - типы всегда соответствуют реальной схеме БД

## Обновление типов

После изменения схемы базы данных:

1. Примени миграции: `supabase db push`
2. Обнови типы: `npm run types:generate:remote`
3. Проверь типы: `npm run type-check`
