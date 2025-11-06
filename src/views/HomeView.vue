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
      <router-view />
    </div>
  </div>
</template>
