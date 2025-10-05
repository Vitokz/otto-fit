<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useTelegram } from '@/composables/useTelegram'

const route = useRoute()
const router = useRouter()
const { hapticFeedback, user } = useTelegram()

const shortName = ref('')
const description = ref('')
const saving = ref(false)
const error = ref<string | null>(null)

const exerciseId = route.params.exerciseId as string

const goBack = () => {
  hapticFeedback('impact')
  router.back()
}

const saveComment = async () => {
  if (!user.value?.id || !shortName.value.trim()) return
  
  try {
    saving.value = true
    error.value = null
    hapticFeedback('impact')

    const { error: insertError } = await supabase
      .from('exercise_comments')
      .insert({
        exercise_id: exerciseId,
        user_id: user.value.id,
        short_name: shortName.value.trim(),
        description: description.value.trim() || null,
        state: 'active'
      })

    if (insertError) {
      throw insertError
    }

    hapticFeedback('success')
    goBack()
  } catch (err: any) {
    console.error('Error saving comment:', err)
    error.value = err.message || 'Ошибка сохранения замечания'
    hapticFeedback('error')
  } finally {
    saving.value = false
  }
}

const handleContentClick = (event: Event) => {
  const target = event.target as HTMLElement
  // Закрываем клавиатуру если клик не по input/textarea
  if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
      activeElement.blur()
    }
  }
}
</script>

<template>
  <div class="tg-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden select-none" style="overscroll-behavior: none; touch-action: none;">
    <!-- Header -->
    <div class="tg-safe-top pb-4 px-6">
      <!-- Back Button -->
      <div class="flex justify-start mb-4">
        <button 
          @click="goBack"
          class="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all duration-200"
          style="touch-action: manipulation;"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
      </div>
      
      <!-- Page Title -->
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">
          Добавить замечание
        </h1>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 px-6 pb-8 flex flex-col min-h-0">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
        <!-- Main Content -->
        <div class="flex-1 flex flex-col min-h-0 p-6" @click="handleContentClick">
          <!-- Short Name Input -->
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-2">Краткое название</h2>
            <input
              v-model="shortName"
              type="text"
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
              placeholder="Введите краткое название замечания..."
              style="touch-action: manipulation;"
              maxlength="100"
              enterkeyhint="next"
              @click.stop
            />
          </div>

          <!-- Description Editor -->
          <div class="flex-1 flex flex-col min-h-0 mb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">Описание</h3>
            <textarea
              v-model="description"
              class="flex-1 w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors resize-none"
              placeholder="Добавьте подробное описание замечания..."
              style="touch-action: manipulation; min-height: 200px;"
              enterkeyhint="done"
              @click.stop
            ></textarea>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-red-600 text-sm">{{ error }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="pt-4">
            <div class="flex gap-4">
              <button
                @click="goBack"
                :disabled="saving"
                class="flex-1 py-4 px-5 bg-gray-100 text-gray-800 rounded-xl font-bold text-base hover:bg-gray-200 active:scale-95 transition-all duration-200 disabled:opacity-50"
                style="touch-action: manipulation;"
              >
                Отмена
              </button>
              <button
                @click="saveComment"
                :disabled="saving || !shortName.trim()"
                class="flex-1 py-4 px-5 bg-blue-500 text-white rounded-xl font-bold text-base hover:bg-blue-600 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style="touch-action: manipulation;"
              >
                <div v-if="saving" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {{ saving ? 'Сохранение...' : 'Добавить' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
