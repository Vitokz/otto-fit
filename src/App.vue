<script setup lang="ts">
import { RouterView, useRouter, useRoute, RouterLink } from 'vue-router'
import { useTelegram } from '@/composables/useTelegram'
import { useAuthStore } from '@/stores/auth'
import { computed, watchEffect, onMounted } from 'vue'

const { isReady, user, webApp, hapticFeedback } = useTelegram()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Инициализируем авторизацию когда приложение готово
onMounted(async () => {
  if (isReady.value && user.value) {
    await authStore.initialize(user.value)
    
    if (authStore.profile) {
      console.log('Telegram user authenticated:', user.value.id)
    } else {
      console.error('Failed to authenticate with Telegram:', user.value.id)
    }
  }
})

// Apply Telegram theme colors to CSS variables
const themeColors = computed(() => {
  if (!webApp.value?.themeParams) return {}
  
  const theme = webApp.value.themeParams
  return {
    '--tg-bg-color': theme.bg_color || '#ffffff',
    '--tg-text-color': theme.text_color || '#000000',
    '--tg-hint-color': theme.hint_color || '#999999',
    '--tg-link-color': theme.link_color || '#2481cc',
    '--tg-button-color': theme.button_color || '#2481cc',
    '--tg-button-text-color': theme.button_text_color || '#ffffff',
    '--tg-secondary-bg-color': theme.secondary_bg_color || '#f1f1f1'
  }
})

watchEffect(() => {
  if (webApp.value) {
    const root = document.documentElement
    Object.entries(themeColors.value).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }
})

// Placeholder handler for not-yet-implemented tabs
const handleComingSoon = (label: string) => {
  hapticFeedback('impact')
  alert(`${label} скоро появится`)
}
</script>

<template>
  <div class="app edge-to-edge" :class="{ 'telegram-ready': isReady }">
    <div v-if="!isReady" class="loading">
      <div class="loading-spinner"></div>
      <p>Загрузка Telegram Mini App...</p>
    </div>
    
    <div v-else class="app-content">      
      <main class="main-content">
        <RouterView />
      </main>

      <!-- Global Bottom Navigation -->
      <nav
        role="navigation"
        aria-label="Главная навигация"
        class="fixed bottom-0 left-0 right-0 z-50 bg-transparent"
      >
        <div class="flex justify-center px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div class="w-full max-w-2xl rounded-full border border-gray-200 bg-white/80 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/60 p-1">
            <div class="flex">
              <RouterLink
                :to="{ name: 'recent' }"
                class="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                :class="route.name === 'recent' ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'"
                aria-label="Недавнее"
                :aria-current="route.name === 'recent' ? 'page' : undefined"
                tabindex="0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                <span>Недавнее</span>
              </RouterLink>

              <button
                type="button"
                @click="handleComingSoon('Рекорды')"
                class="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium text-gray-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                style="touch-action: manipulation;"
                aria-label="Рекорды (скоро)"
                tabindex="0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                  <path d="M7 21h10M12 17l4-8-4-4-4 4 4 8z" />
                </svg>
                <span>Рекорды</span>
              </button>

              <button
                type="button"
                @click="handleComingSoon('Замечания')"
                class="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium text-gray-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                style="touch-action: manipulation;"
                aria-label="Замечания (скоро)"
                tabindex="0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                  <path d="M3 5h18M3 12h18M3 19h18" />
                </svg>
                <span>Замечания</span>
              </button>

              <RouterLink
                :to="{ name: 'categories' }"
                class="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                :class="route.name === 'categories' ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'"
                aria-label="Все упражнения"
                :aria-current="route.name === 'categories' ? 'page' : undefined"
                tabindex="0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                  <rect x="4" y="4" width="7" height="7" rx="1.5" />
                  <rect x="13" y="4" width="7" height="7" rx="1.5" />
                  <rect x="4" y="13" width="7" height="7" rx="1.5" />
                  <rect x="13" y="13" width="7" height="7" rx="1.5" />
                </svg>
                <span>Все упражнения</span>
              </RouterLink>

              <RouterLink
                :to="{ name: 'profile' }"
                class="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                :class="route.name === 'profile' ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'"
                aria-label="Профиль"
                :aria-current="route.name === 'profile' ? 'page' : undefined"
                tabindex="0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                  <path d="M20 21a8 8 0 10-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Профиль</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: var(--tg-viewport-height, 100vh);
  background-color: var(--tg-bg-color, #ffffff);
  color: var(--tg-text-color, #000000);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: var(--tg-viewport-height, 100vh);
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--tg-hint-color, #e0e0e0);
  border-top: 4px solid var(--tg-button-color, #2481cc);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.app-content {
  min-height: var(--tg-viewport-height, 100vh);
  display: flex;
  flex-direction: column;
}

.user-header {
  background-color: var(--tg-secondary-bg-color, #f1f1f1);
  padding: 1rem;
  border-bottom: 1px solid var(--tg-hint-color, #e0e0e0);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--tg-button-color, #2481cc);
  color: var(--tg-button-text-color, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.user-details h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--tg-text-color, #000000);
}

.user-details p {
  margin: 0.25rem 0 0 0;
  color: var(--tg-hint-color, #999999);
  font-size: 0.9rem;
}

.main-content {
  flex: 1;
  padding: 1rem;
  /* Leave space for the global bottom nav */
  padding-bottom: calc(1rem + var(--bottom-nav-height, 0px));
}

/* Telegram-specific responsive adjustments */
@media (max-width: 480px) {
  .user-header {
    padding: 0.75rem;
  }
  
  .main-content {
    padding: 0.75rem;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
}
</style>
