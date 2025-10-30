<script setup lang="ts">
import WelcomeScreen from '@/components/WelcomeScreen.vue'
import { useAuthStore } from '@/stores/auth'
import { useTelegram } from '@/composables/useTelegram'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const authStore = useAuthStore()
const { user: telegramUser } = useTelegram()
const route = useRoute()

const isRecent = computed(() => route.name === 'recent')
const isCategories = computed(() => route.name === 'categories')
</script>

<template>
  <div>
    <!-- Показываем статус авторизации и профиля -->
    <div v-if="authStore.isAuthenticated && authStore.hasCompleteProfile && authStore.profile" class="mb-4 p-4 bg-green-100 rounded-lg">
      <h3 class="text-lg font-semibold text-green-800">Добро пожаловать!</h3>
      <p class="text-green-700">{{ authStore.profile.first_name }} {{ authStore.profile.last_name }}</p>
      <p class="text-sm text-green-600">✅ Профиль полностью заполнен</p>
    </div>

    <div v-else-if="authStore.isAuthenticated && !authStore.hasCompleteProfile && authStore.telegramUser" class="mb-4 p-4 bg-orange-100 rounded-lg">
      <h3 class="text-lg font-semibold text-orange-800">Почти готово!</h3>
      <p class="text-orange-700">{{ authStore.telegramUser.first_name }} {{ authStore.telegramUser.last_name || '' }}</p>
      <p class="text-sm text-orange-600">⚠️ Нужно заполнить анкету</p>
    </div>

    <div v-else-if="telegramUser" class="mb-4 p-4 bg-yellow-100 rounded-lg">
      <h3 class="text-lg font-semibold text-yellow-800">Telegram пользователь найден</h3>
      <p class="text-yellow-700">{{ telegramUser.first_name }} {{ telegramUser.last_name }}</p>
      <p class="text-sm text-yellow-600">Заполните анкету для сохранения данных</p>
    </div>

    <!-- Показываем WelcomeScreen только когда профиль не заполнен -->
    <WelcomeScreen v-if="!authStore.hasCompleteProfile" />

    <!-- Основной контент и нижняя навигация для заполненного профиля -->
    <div v-else>
      <div class="pb-[calc(env(safe-area-inset-bottom)+84px)]">
        <router-view />
      </div>

      <!-- Bottom Navigation -->
      <nav
        role="navigation"
        aria-label="Главная навигация"
        class="fixed bottom-0 left-0 right-0 z-50 bg-transparent"
      >
        <div class="flex justify-center px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div class="w-full max-w-md rounded-full border border-gray-200 bg-white/80 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/60 p-1">
            <div class="flex">
              <RouterLink
                :to="{ name: 'recent' }"
                class="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                :class="isRecent ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'"
                aria-label="Недавнее"
                :aria-current="isRecent ? 'page' : undefined"
                tabindex="0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                <span>Недавнее</span>
              </RouterLink>

              <RouterLink
                :to="{ name: 'categories' }"
                class="flex-1 inline-flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                :class="isCategories ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'"
                aria-label="Категории"
                :aria-current="isCategories ? 'page' : undefined"
                tabindex="0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5">
                  <rect x="4" y="4" width="7" height="7" rx="1.5" />
                  <rect x="13" y="4" width="7" height="7" rx="1.5" />
                  <rect x="4" y="13" width="7" height="7" rx="1.5" />
                  <rect x="13" y="13" width="7" height="7" rx="1.5" />
                </svg>
                <span>Категории</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>
