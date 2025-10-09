<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useTelegram } from '@/composables/useTelegram'
import type { Database } from '@/types/database.types'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

type ExerciseRecord = Database['public']['Tables']['exercise_records']['Row'] & {
  measurement_units?: { name: string }
  exercises?: { name: string }
}

const route = useRoute()
const router = useRouter()
const { hapticFeedback, user } = useTelegram()

const record = ref<ExerciseRecord | null>(null)
const editedValue = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
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

const handleNumberKeypress = (event: KeyboardEvent) => {
  const char = event.key
  const input = event.target as HTMLInputElement
  
  // Enter закрывает клавиатуру
  if (char === 'Enter') {
    inputRef.value?.blur()
    event.preventDefault()
    return
  }
  
  // Разрешаем: цифры, точка, запятая, минус, backspace, delete, tab, escape, стрелки
  if (
    /[0-9]/.test(char) || 
    char === '.' || 
    char === ',' || 
    char === '-' ||
    ['Backspace', 'Delete', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(char)
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

const handleInputFocus = () => {
  // Даем клавиатуре время появиться, затем скроллим к полю
  setTimeout(() => {
    if (inputRef.value && scrollContainerRef.value) {
      const inputRect = inputRef.value.getBoundingClientRect()
      const containerRect = scrollContainerRef.value.getBoundingClientRect()
      
      // Скроллим так, чтобы поле было видно выше клавиатуры
      const scrollOffset = inputRect.top - containerRect.top - 20
      scrollContainerRef.value.scrollBy({
        top: scrollOffset,
        behavior: 'smooth'
      })
    }
  }, 300)
}

const handleContainerClick = (event: MouseEvent) => {
  // Если клик был вне input, закрываем клавиатуру
  if (inputRef.value && event.target !== inputRef.value) {
    inputRef.value.blur()
  }
}

onMounted(() => {
  loadRecord()
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
            <div class="mb-6">
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
                  @click.stop
                  @keypress="handleNumberKeypress"
                />
                <div class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-lg font-medium pointer-events-none">
                  {{ record.measurement_units?.name || 'ед.' }}
                </div>
              </div>
            </div>
            
            <!-- Добавляем отступ для клавиатуры -->
            <div class="h-64"></div>
          </div>

          <!-- Fixed Action Buttons -->
          <div class="p-6 pt-4 border-t border-gray-100 bg-white">
            <div class="flex gap-4">
              <button
                @click="goBack"
                :disabled="saving"
                class="flex-1 py-4 px-5 bg-gray-100 text-gray-800 rounded-xl font-bold text-base hover:bg-gray-200 active:scale-95 transition-all duration-200 disabled:opacity-50"
                style="touch-action: manipulation;"
              >
                Назад
              </button>
              <button
                @click="saveRecord"
                :disabled="saving || editedValue === null"
                class="flex-1 py-4 px-5 bg-blue-500 text-white rounded-xl font-bold text-base hover:bg-blue-600 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
  </div>
</template>
