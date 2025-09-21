# Fit Results - Telegram Mini App

Персональный трекер фитнеса в виде Telegram Mini App на Vue 3 + Vite.

## 🚀 Быстрый старт

### Установка зависимостей
```bash
npm install
```

### Разработка
```bash
npm run dev
```

### Сборка для продакшена
```bash
npm run build
```

### Превью продакшен сборки
```bash
npm run preview
```

## 📱 Telegram Mini App

### Настройка в BotFather

1. Создай бота через [@BotFather](https://t.me/botfather)
2. Используй команду `/newapp` для создания Mini App
3. Укажи URL твоего приложения (например, с ngrok для разработки)

### Разработка с ngrok

Для тестирования в Telegram нужен HTTPS. Используй ngrok:

```bash
# Установи ngrok
npm install -g ngrok

# Запусти dev сервер
npm run dev

# В другом терминале
ngrok http 5173
```

### Структура проекта

```
src/
├── composables/
│   └── useTelegram.ts      # Telegram WebApp API интеграция
├── views/
│   ├── HomeView.vue        # Главная страница
│   └── AboutView.vue       # О приложении
├── App.vue                 # Основной компонент с Telegram темой
└── main.ts                 # Точка входа
```

## 🛠 Технологии

- **Vue 3** - Composition API
- **TypeScript** - Типизация
- **Vite** - Сборщик
- **Vue Router** - Роутинг
- **Pinia** - State management
- **@twa-dev/sdk** - Telegram WebApp SDK

## 📋 Возможности

- ✅ Интеграция с Telegram WebApp API
- ✅ Автоматическое применение темы Telegram
- ✅ Отображение информации о пользователе
- ✅ Haptic feedback
- ✅ Адаптивный дизайн
- ✅ TypeScript поддержка

## 🎨 Telegram тема

Приложение автоматически подстраивается под тему Telegram:
- Цвета интерфейса берутся из `WebApp.themeParams`
- Поддержка светлой и темной темы
- Адаптация под размеры экрана устройства

## 🔧 Дальнейшая разработка

Основа готова! Теперь можешь добавлять:

- Новые страницы и компоненты
- API интеграцию
- Локальное хранилище данных
- Дополнительные Telegram WebApp функции
- Анимации и переходы

## 📚 Полезные ссылки

- [Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [@twa-dev/sdk](https://github.com/twa-dev/SDK)