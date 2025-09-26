<script setup lang="ts">
import WelcomeScreen from '@/components/WelcomeScreen.vue'
import { useAuthStore } from '@/stores/auth'
import { useTelegram } from '@/composables/useTelegram'

const authStore = useAuthStore()
const { user: telegramUser } = useTelegram()
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
    
    <!-- Основной контент для пользователей с заполненным профилем -->
    <div v-else class="p-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">🎯 Готов к тренировкам!</h2>
        <p class="text-gray-600 mb-6">Твой профиль настроен. Время записывать рекорды!</p>
        
        <!-- Здесь будет основной функционал приложения -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p class="text-gray-500">Основной функционал приложения будет здесь...</p>
        </div>
      </div>
    </div>
  </div>
</template>
