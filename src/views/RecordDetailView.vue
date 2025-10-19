<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useTelegram } from '@/composables/useTelegram'
import { useTelegramBackButton } from '@/composables/useTelegramBackButton'
import { useFormKeyboard } from '@/composables/useFormKeyboard'
import type { Database } from '@/types/database.types'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

type ExerciseRecord = Database['public']['Tables']['exercise_records']['Row'] & {
  measurement_units?: { name: string }
  exercises?: { name: string }
}

const route = useRoute()
const router = useRouter()
const { hapticFeedback, user } = useTelegram()
const { setupBackButton, removeBackButton } = useTelegramBackButton()
const { 
  isEditing, 
  activeField, 
  isMobile, 
  handleFieldFocus, 
  createFieldClickHandler, 
  handleInputBlur, 
  createContainerClickHandler, 
  handleViewportChange, 
  handleEnterKey, 
  handleNumberKeypress 
} = useFormKeyboard()

const record = ref<ExerciseRecord | null>(null)
const editedValue = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const inputFieldRef = ref<HTMLDivElement | null>(null)
const scrollContainerRef = ref<HTMLDivElement | null>(null)

const recordId = route.params.recordId as string

const loadRecord = async () => {
  try {
    loading.value = true
    error.value = null
    
    if (!user.value?.id) {
      throw new Error('Пользователь не авторизован')
    }

    const { data: recordData, error: recordError } = await supabase
      .from('exercise_records')
      .select(`
        *,
        measurement_units (
          name
        ),
        exercises (
          name
        )
      `)
      .eq('id', recordId)
      .eq('user_id', user.value.id)
      .single()

    if (recordError) {
      throw recordError
    }

    record.value = recordData
    editedValue.value = recordData.value
  } catch (err: any) {
    console.error('Error loading record:', err)
    error.value = err.message || 'Ошибка загрузки рекорда'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  hapticFeedback('impact')
  // Переходим на страницу упражнения с вкладкой "Рекорды"
  if (record.value?.exercise_id) {
    router.push({ name: 'exercise-detail', params: { exerciseId: record.value.exercise_id }, query: { tab: 'records' } })
  } else {
    router.back()
  }
}

const saveRecord = async () => {
  if (!record.value || !user.value?.id || editedValue.value === null) return
  
  try {
    saving.value = true
    hapticFeedback('impact')
    
    const newValue = editedValue.value
    if (isNaN(newValue)) {
      throw new Error('Некорректное значение')
    }

    const { error: updateError } = await supabase
      .from('exercise_records')
      .update({ value: newValue })
      .eq('id', record.value.id)
      .eq('user_id', user.value.id)

    if (updateError) {
      throw updateError
    }

    // Обновляем локальные данные
    if (record.value) {
      record.value.value = newValue
    }

    hapticFeedback('success')
    goBack()
  } catch (err: any) {
    console.error('Error saving record:', err)
    hapticFeedback('error')
    // TODO: Show error message to user
  } finally {
    saving.value = false
  }
}

// Создаем обработчики для поля
const handleInputFocus = () => {
  handleFieldFocus('value', inputFieldRef.value)
}

const handleInputClick = createFieldClickHandler(inputRef)

// Создаем обработчик клика по контейнеру
const handleContainerClick = createContainerClickHandler(
  [inputRef], 
  [inputFieldRef]
)

// Создаем обработчик изменения viewport
const handleViewportChangeWrapper = () => {
  const getActiveContainer = () => inputFieldRef.value
  handleViewportChange(getActiveContainer)
}

onMounted(() => {
  loadRecord()
  setupBackButton(goBack)
  
  // Слушаем изменения размера окна и высоты viewport
  window.addEventListener('resize', handleViewportChangeWrapper)
})

onUnmounted(() => {
  removeBackButton()
  window.removeEventListener('resize', handleViewportChangeWrapper)
})
</script>

<template>
  <div class="tg-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden select-none" style="overscroll-behavior: none; touch-action: none;">
    <!-- Header -->
    <div class="tg-safe-top pb-4 px-6">
      <!-- Page Title -->
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">
          Рекорд
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
              @click="loadRecord"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              style="touch-action: manipulation;"
            >
              Попробовать снова
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div v-else-if="record" class="flex-1 flex flex-col min-h-0">
          <!-- Scrollable Content -->
          <div 
            ref="scrollContainerRef"
            class="flex-1 overflow-y-auto p-6" 
            style="touch-action: pan-y;"
            @click="handleContainerClick"
          >
            <!-- Exercise Name -->
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-gray-800 mb-2">Упражнение</h2>
              <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p class="text-blue-800 font-medium">{{ record.exercises?.name }}</p>
              </div>
            </div>

            <!-- Record Name -->
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-gray-800 mb-2">Название рекорда</h2>
              <div class="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p class="text-gray-800 font-medium">{{ record.name }}</p>
              </div>
            </div>

            <!-- Value Editor -->
            <div ref="inputFieldRef" class="mb-6" @click="handleInputClick">
              <h3 class="text-lg font-semibold text-gray-800 mb-3">Значение</h3>
              <div class="relative">
                <input
                  ref="inputRef"
                  v-model="editedValue"
                  type="number"
                  step="0.01"
                  inputmode="decimal"
                  class="w-full px-5 py-6 border-2 border-gray-300 rounded-xl text-3xl font-bold text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                  :placeholder="record.value?.toString() || '0'"
                  style="touch-action: manipulation;"
                  @focus="handleInputFocus"
                  @blur="handleInputBlur"
                  @keypress="handleNumberKeypress"
                />
                <div class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-lg font-medium pointer-events-none">
                  {{ record.measurement_units?.name || 'ед.' }}
                </div>
              </div>
            </div>
            
            <!-- Добавляем небольшой отступ для клавиатуры -->
            <div class="h-20"></div>
          </div>

          <!-- Fixed Action Buttons - скрываем в режиме редактирования на мобильных -->
          <div v-if="!isEditing || !isMobile" class="p-6 pt-4 border-t border-gray-100 bg-white">
            <button
              @click="saveRecord"
              :disabled="saving || editedValue === null"
              class="w-full py-4 px-5 bg-blue-500 text-white rounded-xl font-bold text-base hover:bg-blue-600 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style="touch-action: manipulation;"
            >
              <div v-if="saving" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
