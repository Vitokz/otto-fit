<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useTelegram } from '@/composables/useTelegram'
import type { Database } from '@/types/database.types'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

type Exercise = Database['public']['Tables']['exercises']['Row']
type MetconExercise = Database['public']['Tables']['metcon_exercises']['Row']
type ActivityCategory = Database['public']['Tables']['activity_categories']['Row']

const route = useRoute()
const router = useRouter()
const { hapticFeedback } = useTelegram()

const exercises = ref<Exercise[]>([])
const metconExercises = ref<MetconExercise[]>([])
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

    // Загружаем обычные упражнения категории
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true })

    if (exercisesError) {
      throw exercisesError
    }

    exercises.value = exercisesData || []

    // Загружаем метконы категории
    const { data: metconData, error: metconError } = await supabase
      .from('metcon_exercises')
      .select('*')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: true })

    if (metconError) {
      console.error('Error loading metcon exercises:', metconError)
    } else {
      metconExercises.value = metconData || []
    }
  } catch (err: any) {
    console.error('Error loading category and exercises:', err)
    error.value = err.message || 'Ошибка загрузки упражнений'
  } finally {
    loading.value = false
  }
}

const selectExercise = (exercise: Exercise | MetconExercise) => {
  hapticFeedback('impact')
  // Определяем тип упражнения по наличию поля description
  if ('description' in exercise && exercise.description) {
    // Это меткон
    router.push({ name: 'metcon-detail', params: { exerciseId: exercise.id } })
  } else {
    // Это обычное упражнение
    router.push({ name: 'exercise-detail', params: { exerciseId: exercise.id } })
  }
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
    <!-- Main centered container -->
    <div class="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto px-6">
      <!-- Header -->
      <div class="tg-safe-top pb-4">
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
        
        <!-- Category Title -->
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ category?.name || 'Упражнения' }}
          </h1>
        </div>
      </div>

      <!-- Exercises List -->
      <div class="flex-1 pb-8 flex flex-col min-h-0">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
        <!-- Loading State -->
        <LoadingSpinner v-if="loading" message="Загрузка упражнений..." />

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
        <div v-else-if="exercises.length > 0 || metconExercises.length > 0" class="p-6 overflow-y-auto" style="touch-action: pan-y;">
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-3">
            <!-- Regular Exercises -->
            <button
              v-for="exercise in exercises"
              :key="exercise.id"
              @click="selectExercise(exercise)"
              class="p-3 lg:p-4 xl:p-5 bg-gray-50 border border-gray-200 rounded-xl text-center hover:bg-gray-100 active:scale-95 transition-all duration-200 group aspect-square flex flex-col justify-between items-center"
              style="touch-action: manipulation;"
            >
              <!-- Top section with icon -->
              <div class="flex items-center justify-center" style="height: 60px;">
                <!-- Exercise Icon/Logo -->
                <div class="w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <img 
                    v-if="exercise.logo_url" 
                    :src="exercise.logo_url" 
                    :alt="exercise.name"
                    class="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 object-contain"
                  />
                  <span v-else class="text-2xl lg:text-3xl xl:text-4xl">💪</span>
                </div>
              </div>
              
              <!-- Bottom section with name -->
              <div class="w-full mt-2">
                <div class="bg-blue-100 border border-blue-200 rounded-lg p-2 lg:p-3">
                  <h3 class="text-sm lg:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight overflow-hidden" style="display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical;">
                    {{ exercise.name }}
                  </h3>
                </div>
              </div>
            </button>

            <!-- Metcon Exercises -->
            <button
              v-for="metcon in metconExercises"
              :key="metcon.id"
              @click="selectExercise(metcon)"
              class="p-3 lg:p-4 xl:p-5 bg-gray-50 border border-gray-200 rounded-xl text-center hover:bg-gray-100 active:scale-95 transition-all duration-200 group aspect-square flex flex-col justify-between items-center"
              style="touch-action: manipulation;"
            >
              <!-- Top section with icon -->
              <div class="flex items-center justify-center" style="height: 60px;">
                <!-- Metcon Icon -->
                <div class="w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <img 
                    v-if="metcon.logo_url" 
                    :src="metcon.logo_url" 
                    :alt="metcon.name"
                    class="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 object-contain"
                  />
                  <span v-else class="text-2xl lg:text-3xl xl:text-4xl">🔥</span>
                </div>
              </div>
              
              <!-- Bottom section with name -->
              <div class="w-full mt-2">
                <div class="bg-blue-100 border border-blue-200 rounded-lg p-2 lg:p-3">
                  <h3 class="text-sm lg:text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight overflow-hidden" style="display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical;">
                    {{ metcon.name }}
                  </h3>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex-1 flex flex-col items-center justify-center p-6">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <span class="text-2xl">🏃‍♂️</span>
          </div>
          <p class="text-gray-500 font-medium mb-2 text-center">Упражнения не найдены</p>
          <p class="text-gray-400 text-sm text-center">В этой категории пока нет упражнений</p>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>
