<script setup lang="ts">
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()

// Автоматически перенаправляем на главную через 2 секунды
onMounted(() => {
  setTimeout(() => {
    router.push('/')
  }, 2000)
})
</script>

<template>
  <div class="fixed inset-0 w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-6" style="overscroll-behavior: none;">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-900">
        Ты успешно авторизован
      </h1>
    </div>
  </div>
</template>
