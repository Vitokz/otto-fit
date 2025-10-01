<script setup lang="ts">
import { useTelegram } from '@/composables/useTelegram'
import { useRouter } from 'vue-router'

const { user, hapticFeedback } = useTelegram()
const router = useRouter()

const handleStart = () => {
  hapticFeedback('impact')
  router.push('/user-data')
}

</script>

<template>
  <div class="tg-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden select-none" style="overscroll-behavior: none; touch-action: none;">
    <!-- Header -->
    <div class="tg-safe-top pb-6 px-6 text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">OttoFit</h1>
      <p class="text-lg text-gray-600">Персональный дневник тренировок</p>
    </div>

    <!-- Welcome Message + Main Features -->
    <div class="flex-1 px-6 mb-8">
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <!-- Features List -->
        <div class="space-y-4">
          <!-- Records Info -->
          <div class="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span class="text-2xl">📊</span>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Записи рекордов</h3>
              <p class="text-sm text-gray-600">Отслеживай свои достижения по упражнениям</p>
            </div>
          </div>

          <!-- Notes Info -->
          <div class="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
            <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span class="text-2xl">📝</span>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-1">Замечания по технике</h3>
              <p class="text-sm text-gray-600">Сохраняй важные моменты для улучшения</p>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Start Button -->
    <div class="px-6 pb-8">
      <button 
        @click="handleStart"
        class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
        style="touch-action: manipulation;"
      >
        Начать
      </button>
    </div>
  </div>
</template>
