<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useTelegram } from '@/composables/useTelegram'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const authStore = useAuthStore()
const { hapticFeedback } = useTelegram()
const router = useRouter()

onMounted(() => {
  // Тактильная обратная связь при загрузке страницы
  hapticFeedback('success')
})

const continueToApp = () => {
  hapticFeedback('impact')
  router.push('/')
}
</script>

<template>
  <div class="fixed inset-0 w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center px-6" style="overscroll-behavior: none;">
    
    <!-- Success Icon -->
    <div class="mb-8 relative">
      <div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
        <div class="text-4xl">🎉</div>
      </div>
      <!-- Animated rings -->
      <div class="absolute inset-0 w-24 h-24 border-4 border-green-300 rounded-full animate-ping opacity-20"></div>
      <div class="absolute inset-2 w-20 h-20 border-2 border-green-400 rounded-full animate-ping opacity-30 animation-delay-150"></div>
    </div>

    <!-- Success Message -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">
        Отлично! 🚀
      </h1>
      <p class="text-lg text-gray-700 mb-2">
        Ты успешно авторизовался!
      </p>
      <div v-if="authStore.telegramUser" class="text-base text-gray-600">
        Добро пожаловать, {{ authStore.telegramUser.first_name }}!
      </div>
    </div>

    <!-- User Info Card -->
    <div v-if="authStore.telegramUser" class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 max-w-sm w-full">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
          {{ authStore.telegramUser.first_name.charAt(0) }}
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-gray-900 text-lg">
            {{ authStore.telegramUser.first_name }} {{ authStore.telegramUser.last_name }}
          </h3>
          <p v-if="authStore.telegramUser.username" class="text-gray-500 text-sm">
            @{{ authStore.telegramUser.username }}
          </p>
          <p class="text-green-600 text-sm font-medium">
            ✅ Авторизован
          </p>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="w-full max-w-sm space-y-4">
      <button 
        @click="continueToApp"
        class="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform text-lg"
        style="touch-action: manipulation;"
      >
        Продолжить 🎯
      </button>
      
      <div class="text-center">
        <p class="text-sm text-gray-500">
          Теперь ты можешь пользоваться всеми функциями приложения
        </p>
      </div>
    </div>

    <!-- Decorative Elements -->
    <div class="absolute top-10 left-10 text-2xl opacity-20 animate-bounce animation-delay-300">🎊</div>
    <div class="absolute top-20 right-16 text-xl opacity-20 animate-bounce animation-delay-500">✨</div>
    <div class="absolute bottom-32 left-8 text-lg opacity-20 animate-bounce animation-delay-700">🌟</div>
    <div class="absolute bottom-40 right-12 text-2xl opacity-20 animate-bounce animation-delay-900">🎈</div>
  </div>
</template>

<style scoped>
.animation-delay-150 {
  animation-delay: 150ms;
}

.animation-delay-300 {
  animation-delay: 300ms;
}

.animation-delay-500 {
  animation-delay: 500ms;
}

.animation-delay-700 {
  animation-delay: 700ms;
}

.animation-delay-900 {
  animation-delay: 900ms;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -15px, 0);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -7px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

.animate-bounce {
  animation: bounce 2s infinite;
}
</style>
