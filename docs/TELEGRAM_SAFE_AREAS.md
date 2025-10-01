# Telegram Mini App Safe Areas

Этот проект включает универсальную систему для работы с safe areas в Telegram Mini App, которая автоматически учитывает системные элементы и кнопки Telegram.

## CSS Переменные

```css
:root {
  /* Safe area insets для Telegram Mini App */
  --tg-safe-area-inset-top: max(env(safe-area-inset-top), 20px);
  --tg-safe-area-inset-bottom: max(env(safe-area-inset-bottom), 20px);
  --tg-safe-area-inset-left: env(safe-area-inset-left);
  --tg-safe-area-inset-right: env(safe-area-inset-right);
  
  /* Высота заголовка включая safe area */
  --tg-header-height: calc(var(--tg-safe-area-inset-top) + 60px);
}
```

## Утилитарные классы

### Отдельные стороны
- `.tg-safe-top` - отступ сверху
- `.tg-safe-bottom` - отступ снизу  
- `.tg-safe-left` - отступ слева
- `.tg-safe-right` - отступ справа

### Комбинированные
- `.tg-safe-x` - отступы слева и справа
- `.tg-safe-y` - отступы сверху и снизу
- `.tg-safe-all` - отступы со всех сторон

### Специальные классы
- `.tg-header` - для заголовков с учетом safe area
- `.tg-content` - для контента, который должен избегать заголовка
- `.tg-screen` - полноэкранный контейнер с safe areas

## Примеры использования

### Полноэкранный компонент
```vue
<template>
  <div class="tg-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Заголовок -->
    <div class="tg-safe-top pb-4 px-6">
      <h1>Заголовок</h1>
    </div>
    
    <!-- Контент -->
    <div class="flex-1 px-6 pb-8">
      <!-- Содержимое -->
    </div>
  </div>
</template>
```

### Заголовок с кнопкой назад
```vue
<template>
  <div class="tg-screen">
    <div class="tg-safe-top pb-4 px-6">
      <div class="flex items-center">
        <button @click="goBack">←</button>
        <h1>Заголовок</h1>
      </div>
    </div>
  </div>
</template>
```

## Преимущества

1. **Автоматическая адаптация** - учитывает safe areas устройства и Telegram
2. **Универсальность** - работает на всех устройствах и в разных режимах
3. **Простота использования** - достаточно заменить классы
4. **Консистентность** - единый подход во всем приложении
5. **Будущая совместимость** - легко обновлять при изменениях в Telegram

## Миграция существующих компонентов

Замените:
```vue
<!-- Старый код -->
<div class="fixed inset-0 w-full h-full">
  <div class="pt-20 pb-4 px-6">

<!-- Новый код -->
<div class="tg-screen">
  <div class="tg-safe-top pb-4 px-6">
```

Все компоненты в проекте уже обновлены для использования новой системы.
