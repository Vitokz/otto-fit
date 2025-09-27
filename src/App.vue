<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useTelegram } from '@/composables/useTelegram'
import { useAuthStore } from '@/stores/auth'
import { computed, watchEffect, onMounted } from 'vue'

const { isReady, user, webApp } = useTelegram()
const authStore = useAuthStore()
const router = useRouter()

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
</script>

<template>
  <div class="app" :class="{ 'telegram-ready': isReady }">
    <div v-if="!isReady" class="loading">
      <div class="loading-spinner"></div>
      <p>Загрузка Telegram Mini App...</p>
    </div>
    
    <div v-else class="app-content">      
      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background-color: var(--tg-bg-color, #ffffff);
  color: var(--tg-text-color, #000000);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
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
  min-height: 100vh;
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
