<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useTelegram } from '@/composables/useTelegram'
import type { Database } from '@/types/database.types'

type Exercise = Database['public']['Tables']['exercises']['Row']
type ActivityCategory = Database['public']['Tables']['activity_categories']['Row']

const route = useRoute()
const router = useRouter()
const { hapticFeedback } = useTelegram()

const exercises = ref<Exercise[]>([])
const category = ref<ActivityCategory | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const categoryId = route.params.categoryId as string

const loadCategoryAndExercises = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Загружаем категорию
    const { data: categoryData, error: categoryError } = await supabase
      .from('activity_categories')
      .select('*')
      .eq('id', categoryId)
      .single()

    if (categoryError) {
      throw categoryError
    }

    category.value = categoryData

    // Загружаем упражнения категории
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true })

    if (exercisesError) {
      throw exercisesError
    }

    exercises.value = exercisesData || []
  } catch (err: any) {
    console.error('Error loading category and exercises:', err)
    error.value = err.message || 'Ошибка загрузки упражнений'
  } finally {
    loading.value = false
  }
}

const selectExercise = (exercise: Exercise) => {
  hapticFeedback('impact')
  // TODO: Navigate to exercise details/tracking
  console.log('Selected exercise:', exercise.name)
}

const goBack = () => {
  hapticFeedback('impact')
  router.back()
}

onMounted(() => {
  loadCategoryAndExercises()
})
</script>

<template>
  <div class="tg-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden select-none" style="overscroll-behavior: none; touch-action: none;">
    <!-- Header -->
    <div class="tg-safe-top pb-4 px-6">
      <div class="flex items-center mb-4">
        <button 
          @click="goBack"
          class="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center mr-4 hover:bg-gray-50 active:scale-95 transition-all duration-200"
          style="touch-action: manipulation;"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ category?.name || 'Упражнения' }}
          </h1>
        </div>
      </div>
    </div>

    <!-- Exercises List -->
    <div class="flex-1 px-6 pb-8 flex flex-col min-h-0">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
        <!-- Loading State -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-gray-500">Загрузка упражнений...</p>
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
              @click="loadCategoryAndExercises"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              style="touch-action: manipulation;"
            >
              Попробовать снова
            </button>
          </div>
        </div>

        <!-- Exercises Grid -->
        <div v-else-if="exercises.length > 0" class="p-6 overflow-y-auto" style="touch-action: pan-y;">
          <div class="grid grid-cols-2 gap-4">
            <button
              v-for="exercise in exercises"
              :key="exercise.id"
              @click="selectExercise(exercise)"
              class="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-center hover:bg-gray-100 active:scale-95 transition-all duration-200 group aspect-square flex flex-col justify-between items-center"
              style="touch-action: manipulation;"
            >
              <!-- Top section with icon -->
              <div class="flex items-center justify-center" style="height: 80px;">
                <!-- Exercise Icon/Logo -->
                <div class="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <img 
                    v-if="exercise.logo_url" 
                    :src="exercise.logo_url" 
                    :alt="exercise.name"
                    class="w-10 h-10 object-contain"
                  />
                  <span v-else class="text-3xl">💪</span>
                </div>
              </div>
              
              <!-- Bottom section with name -->
              <div class="w-full mt-3">
                <h3 class="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight overflow-hidden" style="display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical;">
                  {{ exercise.name }}
                </h3>
              </div>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">🏃‍♂️</span>
            </div>
            <p class="text-gray-500 font-medium mb-2">Упражнения не найдены</p>
            <p class="text-gray-400 text-sm">В этой категории пока нет упражнений</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
