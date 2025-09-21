<script setup lang="ts">
import WelcomeScreen from '@/components/WelcomeScreen.vue'
import { useAuthStore } from '@/stores/auth'
import { useTelegram } from '@/composables/useTelegram'

const authStore = useAuthStore()
const { user: telegramUser } = useTelegram()
</script>

<template>
  <div>
    <!-- Показываем статус авторизации для отладки -->
    <div v-if="authStore.isAuthenticated && authStore.profile" class="mb-4 p-4 bg-green-100 rounded-lg">
      <h3 class="text-lg font-semibold text-green-800">Добро пожаловать!</h3>
      <p class="text-green-700">{{ authStore.profile.first_name }} {{ authStore.profile.last_name }}</p>
      <p class="text-sm text-green-600">Профиль загружен из Supabase</p>
    </div>

    <div v-else-if="telegramUser" class="mb-4 p-4 bg-yellow-100 rounded-lg">
      <h3 class="text-lg font-semibold text-yellow-800">Telegram пользователь найден</h3>
      <p class="text-yellow-700">{{ telegramUser.first_name }} {{ telegramUser.last_name }}</p>
      <p class="text-sm text-yellow-600">Заполните анкету для сохранения данных</p>
    </div>

    <WelcomeScreen />
  </div>
</template>
