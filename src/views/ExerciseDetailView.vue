<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useTelegram } from '@/composables/useTelegram'
import type { Database } from '@/types/database.types'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

type Exercise = Database['public']['Tables']['exercises']['Row']
type ExerciseComment = Database['public']['Tables']['exercise_comments']['Row']
type ExerciseRecord = Database['public']['Tables']['exercise_records']['Row'] & {
  measurement_units?: { name: string }
}
type MeasurementUnit = Database['public']['Tables']['measurement_units']['Row']

const route = useRoute()
const router = useRouter()
const { hapticFeedback, user } = useTelegram()

const exercise = ref<Exercise | null>(null)
const comments = ref<ExerciseComment[]>([])
const records = ref<ExerciseRecord[]>([])
const measurementUnits = ref<MeasurementUnit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<'comments' | 'records'>('comments')

const exerciseId = route.params.exerciseId as string

// Устанавливаем активную вкладку из URL параметра
const initializeTab = () => {
  const tabParam = route.query.tab as string
  if (tabParam === 'records') {
    activeTab.value = 'records'
  } else {
    activeTab.value = 'comments'
  }
}

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

    // Загружаем единицы измерения
    const { data: unitsData, error: unitsError } = await supabase
      .from('measurement_units')
      .select('*')
      .order('name', { ascending: true })

    if (unitsError) {
      console.error('Error loading measurement units:', unitsError)
    } else {
      measurementUnits.value = unitsData || []
    }

    if (user.value?.id) {
      // Загружаем замечания пользователя для этого упражнения (только активные)
      const { data: commentsData, error: commentsError } = await supabase
        .from('exercise_comments')
        .select('*')
        .eq('exercise_id', exerciseId)
        .eq('user_id', user.value.id)
        .eq('state', 'active')
        .order('created_at', { ascending: false })

      if (commentsError) {
        console.error('Error loading comments:', commentsError)
      } else {
        comments.value = commentsData || []
      }

      // Загружаем рекорды пользователя для этого упражнения
      const { data: recordsData, error: recordsError } = await supabase
        .from('exercise_records')
        .select(`
          *,
          measurement_units (
            name
          )
        `)
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
  router.push({ name: 'category-exercises', params: { categoryId: exercise.value?.category_id } }) 
}

const openCommentDetail = (comment: ExerciseComment) => {
  hapticFeedback('impact')
  router.push({ name: 'comment-detail', params: { commentId: comment.id } })
}

const addComment = () => {
  hapticFeedback('impact')
  router.push({ name: 'add-comment', params: { exerciseId } })
}

const addRecord = () => {
  hapticFeedback('impact')
  if (activeTab.value === 'records') {
    openAddRecord()
  } else {
    addComment()
  }
}

const openAddRecord = () => {
  hapticFeedback('impact')
  router.push({ name: 'add-record', params: { exerciseId } })
}


const openRecordDetail = (record: ExerciseRecord) => {
  hapticFeedback('impact')
  router.push({ name: 'record-detail', params: { recordId: record.id } })
}


const handleNumberKeypress = (event: KeyboardEvent) => {
  const char = event.key
  const input = event.target as HTMLInputElement
  
  // Разрешаем: цифры, точка, запятая, минус, backspace, delete, tab, escape, enter
  if (
    /[0-9]/.test(char) || 
    char === '.' || 
    char === ',' || 
    char === '-' ||
    ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(char)
  ) {
    // Дополнительная проверка для точки/запятой - только одна на поле
    if ((char === '.' || char === ',') && input.value.includes('.')) {
      event.preventDefault()
    }
    return
  }
  
  // Блокируем все остальные символы
  event.preventDefault()
}

onMounted(() => {
  initializeTab()
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
        <LoadingSpinner v-if="loading" />

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
                <div class="space-y-3">
                  <div
                    v-for="comment in comments"
                    :key="comment.id"
                    @click="openCommentDetail(comment)"
                    class="bg-gray-50 rounded-2xl p-4 border border-gray-100 h-24 flex items-center justify-between group hover:bg-gray-100 transition-colors cursor-pointer active:scale-95 transition-all duration-200"
                    style="touch-action: manipulation;"
                  >
                    <div class="flex-1 min-w-0">
                      <div class="mb-1">
                        <span class="text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg inline-block max-w-full truncate">{{ comment.short_name }}</span>
                      </div>
                      <p v-if="comment.description" class="text-sm text-gray-700 leading-tight overflow-hidden" style="display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical;">
                        {{ comment.description }}
                      </p>
                    </div>
                    <div class="ml-4 flex items-center">
                      <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
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
                <div class="space-y-3">
                  <div
                    v-for="record in records"
                    :key="record.id"
                    @click="openRecordDetail(record)"
                    class="bg-gray-50 rounded-2xl p-3 border border-gray-100 h-16 flex items-center justify-between cursor-pointer hover:bg-gray-100 active:scale-95 transition-all duration-200"
                    style="touch-action: manipulation;"
                  >
                    <div class="flex-1 min-w-0 pr-4">
                      <span class="text-sm font-medium text-gray-900 block truncate">{{ record.name }}</span>
                    </div>
                    <div class="flex items-baseline flex-shrink-0" style="min-width: 120px;">
                      <span class="text-lg font-bold text-blue-600 text-right" style="min-width: 80px;">{{ record.value }}</span>
                      <span class="text-sm text-gray-500 flex-shrink-0 ml-1">{{ record.measurement_units?.name || 'ед.' }}</span>
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
              @click="addRecord"
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
