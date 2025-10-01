<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useTelegram } from '@/composables/useTelegram'
import type { Database } from '@/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']
type ExerciseComment = Database['public']['Tables']['exercise_comments']['Row']
type ExerciseRecord = Database['public']['Tables']['exercise_records']['Row']

const route = useRoute()
const router = useRouter()
const { hapticFeedback, user } = useTelegram()

const exercise = ref<Exercise | null>(null)
const comments = ref<ExerciseComment[]>([])
const records = ref<ExerciseRecord[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<'comments' | 'records'>('comments')

const exerciseId = route.params.exerciseId as string

const loadExerciseData = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Загружаем упражнение
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single()

    if (exerciseError) {
      throw exerciseError
    }

    exercise.value = exerciseData

    if (user.value?.id) {
      // Загружаем замечания пользователя для этого упражнения
      const { data: commentsData, error: commentsError } = await supabase
        .from('exercise_comments')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })

      if (commentsError) {
        console.error('Error loading comments:', commentsError)
      } else {
        comments.value = commentsData || []
      }

      // Загружаем рекорды пользователя для этого упражнения
      const { data: recordsData, error: recordsError } = await supabase
        .from('exercise_records')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })

      if (recordsError) {
        console.error('Error loading records:', recordsError)
      } else {
        records.value = recordsData || []
      }
    }
  } catch (err: any) {
    console.error('Error loading exercise data:', err)
    error.value = err.message || 'Ошибка загрузки упражнения'
  } finally {
    loading.value = false
  }
}

const switchTab = (tab: 'comments' | 'records') => {
  hapticFeedback('impact')
  activeTab.value = tab
}

const goBack = () => {
  hapticFeedback('impact')
  router.back()
}

const addComment = () => {
  hapticFeedback('impact')
  // TODO: Implement add comment functionality
  console.log('Add comment')
}

onMounted(() => {
  loadExerciseData()
})
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
      
      <!-- Exercise Title -->
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ exercise?.name || 'Упражнение' }}
        </h1>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 px-6 pb-8 flex flex-col min-h-0">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
        <!-- Loading State -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-gray-500">Загрузка...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex-1 flex items-center justify-center">
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">⚠️</span>
            </div>
            <p class="text-red-600 font-medium mb-2">Ошибка загрузки</p>
            <p class="text-gray-500 text-sm mb-4">{{ error }}</p>
            <button 
              @click="loadExerciseData"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              style="touch-action: manipulation;"
            >
              Попробовать снова
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div v-else class="flex-1 flex flex-col min-h-0">
          <!-- Tabs -->
          <div class="p-6 pb-0">
            <div class="flex bg-gray-100 rounded-2xl p-1">
              <button
                @click="switchTab('comments')"
                :class="[
                  'flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200',
                  activeTab === 'comments' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                ]"
                style="touch-action: manipulation;"
              >
                Замечания
              </button>
              <button
                @click="switchTab('records')"
                :class="[
                  'flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200',
                  activeTab === 'records' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                ]"
                style="touch-action: manipulation;"
              >
                Рекорды
              </button>
            </div>
          </div>

          <!-- Tab Content -->
          <div class="flex-1 flex flex-col min-h-0">
            <!-- Comments Tab -->
            <div v-if="activeTab === 'comments'" class="flex-1 flex flex-col min-h-0">
              <!-- Comments List -->
              <div v-if="comments.length > 0" class="flex-1 p-6 pt-4 overflow-y-auto" style="touch-action: pan-y;">
                <div class="space-y-4">
                  <div
                    v-for="comment in comments"
                    :key="comment.id"
                    class="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span class="text-sm font-medium text-gray-900">{{ comment.short_name }}</span>
                      </div>
                      <span class="text-xs text-gray-500">
                        {{ new Date(comment.created_at).toLocaleDateString('ru-RU') }}
                      </span>
                    </div>
                    <p v-if="comment.description" class="text-sm text-gray-700 leading-relaxed">
                      {{ comment.description }}
                    </p>
                    <div class="mt-2 flex items-center justify-between">
                      <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {{ comment.state }}
                      </span>
                      <span v-if="comment.finished_at" class="text-xs text-gray-500">
                        Завершено: {{ new Date(comment.finished_at).toLocaleDateString('ru-RU') }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty Comments State -->
              <div v-else class="flex-1 flex flex-col items-center justify-center p-6">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <span class="text-2xl">📝</span>
                </div>
                <p class="text-gray-500 font-medium mb-2 text-center">Замечаний пока нет</p>
                <p class="text-gray-400 text-sm text-center">Добавьте первое замечание для этого упражнения</p>
              </div>
            </div>

            <!-- Records Tab -->
            <div v-if="activeTab === 'records'" class="flex-1 flex flex-col min-h-0">
              <!-- Records List -->
              <div v-if="records.length > 0" class="flex-1 p-6 pt-4 overflow-y-auto" style="touch-action: pan-y;">
                <div class="space-y-4">
                  <div
                    v-for="record in records"
                    :key="record.id"
                    class="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-gray-900">{{ record.name }}</span>
                      <span class="text-xs text-gray-500">
                        {{ new Date(record.created_at).toLocaleDateString('ru-RU') }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <span class="text-lg font-bold text-blue-600">{{ record.value }}</span>
                        <span class="text-sm text-gray-500">{{ record.measure_unit_id }}</span>
                      </div>
                      <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                        {{ record.state }}
                      </span>
                    </div>
                    <div v-if="record.previoused_at" class="mt-2">
                      <span class="text-xs text-gray-500">
                        Предыдущий: {{ new Date(record.previoused_at).toLocaleDateString('ru-RU') }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty Records State -->
              <div v-else class="flex-1 flex flex-col items-center justify-center p-6">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <span class="text-2xl">🏆</span>
                </div>
                <p class="text-gray-500 font-medium mb-2 text-center">Рекордов пока нет</p>
                <p class="text-gray-400 text-sm text-center">Добавьте первый рекорд для этого упражнения</p>
              </div>
            </div>
          </div>

          <!-- Add Button -->
          <div class="p-6 pt-4">
            <button
              @click="addComment"
              class="w-full py-4 bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-600 active:scale-95 transition-all duration-200"
              style="touch-action: manipulation;"
            >
              {{ activeTab === 'comments' ? 'Добавить замечание' : 'Добавить рекорд' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
