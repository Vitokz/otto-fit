<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useTelegram } from '@/composables/useTelegram'
import type { Database } from '@/types/database.types'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

type Exercise = Database['public']['Tables']['exercises']['Row']
type UserWork = Database['public']['Tables']['user_with_exercise_work']['Row'] & {
  exercises: Pick<Exercise, 'id' | 'name' | 'logo_url'> | null
}

const router = useRouter()
const authStore = useAuthStore()
const { hapticFeedback } = useTelegram()

const recent = ref<UserWork[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const loadRecent = async () => {
  try {
    loading.value = true
    error.value = null

    if (!authStore.telegramUser) {
      recent.value = []
      return
    }

    const { data, error: fetchError } = await supabase
      .from('user_with_exercise_work')
      .select('updated_at, exercise_id, exercises(id,name,logo_url)')
      .eq('user_id', authStore.telegramUser.id)
      .not('exercise_id', 'is', null)
      .order('updated_at', { ascending: false })

    if (fetchError) {
      throw fetchError
    }

    recent.value = (data as UserWork[]) || []
  } catch (err: any) {
    console.error('Error loading recent exercises:', err)
    error.value = err.message || 'Ошибка загрузки'
  } finally {
    loading.value = false
  }
}

const handleOpenExercise = (exerciseId: string | null) => {
  if (!exerciseId) return
  hapticFeedback('impact')
  router.push({ name: 'exercise-detail', params: { exerciseId } })
}

onMounted(() => {
  loadRecent()
})
</script>

<template>
  <div class="tg-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden select-none" style="overscroll-behavior: none; touch-action: none;">
    <div class="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto px-6">
      <div class="tg-safe-top pb-4 text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Недавние упражнения</h1>
      </div>

      <div class="flex-1 pb-8 flex flex-col min-h-0">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
          <!-- Loading -->
          <LoadingSpinner v-if="loading" message="Загрузка..." />

          <!-- Error -->
          <div v-else-if="error" class="flex-1 flex items-center justify-center">
            <div class="text-center p-6">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">⚠️</span>
              </div>
              <p class="text-red-600 font-medium mb-2">Ошибка загрузки</p>
              <p class="text-gray-500 text-sm mb-4">{{ error }}</p>
              <button @click="loadRecent" class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors" style="touch-action: manipulation;">Попробовать снова</button>
            </div>
          </div>

          <!-- List -->
          <div v-else-if="recent.length > 0" class="p-2 sm:p-4 overflow-y-auto space-y-2 sm:space-y-3" style="touch-action: pan-y;">
            <button
              v-for="item in recent"
              :key="item.updated_at + (item.exercise_id || '')"
              @click="handleOpenExercise(item.exercises?.id || null)"
              class="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-gray-100 active:scale-95 transition-all duration-200"
              style="touch-action: manipulation;"
              :aria-label="item.exercises?.name || 'Упражнение'"
            >
              <div class="flex items-center justify-between gap-3">
                <!-- Left emoji/logo -->
                <div class="shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                  <img
                    v-if="item.exercises?.logo_url"
                    :src="item.exercises.logo_url"
                    :alt="item.exercises.name || 'Логотип упражнения'"
                    class="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                  />
                  <span v-else class="text-lg sm:text-xl">💪</span>
                </div>

                <!-- Title -->
                <div class="min-w-0 flex-1">
                  <p class="text-base sm:text-lg font-semibold text-gray-900 truncate">{{ item.exercises?.name || 'Упражнение' }}</p>
                </div>

                <!-- Right arrow -->
                <div class="shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>

          <!-- Empty -->
          <div v-else class="flex-1 flex items-center justify-center">
            <div class="text-center p-6">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-2xl">🕒</span>
              </div>
              <p class="text-gray-500 font-medium mb-2">Пока нет недавних</p>
              <p class="text-gray-400 text-sm">Когда вы начнёте заниматься, здесь появится список.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


