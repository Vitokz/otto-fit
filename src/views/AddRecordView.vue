<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useTelegram } from '@/composables/useTelegram'
import { useTelegramBackButton } from '@/composables/useTelegramBackButton'
import { useFormKeyboard } from '@/composables/useFormKeyboard'
import type { Database } from '@/types/database.types'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

type Exercise = Database['public']['Tables']['exercises']['Row']
type ExerciseRecord = Database['public']['Tables']['exercise_records']['Row'] & {
  measurement_units?: { name: string }
}
type MeasurementUnit = Database['public']['Tables']['measurement_units']['Row']

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

const exercise = ref<Exercise | null>(null)
const measurementUnits = ref<MeasurementUnit[]>([])
const newRecordName = ref('')
const newRecordValue = ref('')
const newRecordUnitId = ref<number | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
const valueInputRef = ref<HTMLInputElement | null>(null)
const nameFieldRef = ref<HTMLDivElement | null>(null)
const valueFieldRef = ref<HTMLDivElement | null>(null)
const scrollContainerRef = ref<HTMLDivElement | null>(null)

const exerciseId = route.params.exerciseId as string

const loadData = async () => {
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
  } catch (err: any) {
    console.error('Error loading data:', err)
    error.value = err.message || 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  hapticFeedback('impact')
  router.replace({ name: 'exercise-detail', params: { exerciseId }, query: { tab: 'records', from: route.query.from as string | undefined } })
}

const saveNewRecord = async () => {
  if (!user.value?.id || !newRecordName.value.trim() || !newRecordValue.value || !newRecordUnitId.value) return
  
  try {
    saving.value = true
    hapticFeedback('impact')
    
    const value = parseFloat(newRecordValue.value)
    if (isNaN(value)) {
      throw new Error('Некорректное значение')
    }

    const { error: insertError } = await supabase
      .from('exercise_records')
      .insert({
        exercise_id: exerciseId,
        user_id: user.value.id,
        name: newRecordName.value.trim(),
        value: value,
        measure_unit_id: newRecordUnitId.value.toString(),
        state: 'current'
      })

    if (insertError) {
      throw insertError
    }

    hapticFeedback('success')
    router.replace({ name: 'exercise-detail', params: { exerciseId }, query: { tab: 'records', from: route.query.from as string | undefined } })
  } catch (err: any) {
    console.error('Error saving new record:', err)
    hapticFeedback('error')
    // TODO: Show error message to user
  } finally {
    saving.value = false
  }
}

// Создаем обработчики для полей
const handleNameFocus = () => {
  handleFieldFocus('name', nameFieldRef.value)
}

const handleValueFocus = () => {
  handleFieldFocus('value', valueFieldRef.value)
}

const handleNameClick = createFieldClickHandler(nameInputRef)
const handleValueClick = createFieldClickHandler(valueInputRef)

// Создаем обработчик клика по контейнеру
const handleContainerClick = createContainerClickHandler(
  [nameInputRef, valueInputRef], 
  [nameFieldRef, valueFieldRef]
)

// Создаем обработчик изменения viewport
const handleViewportChangeWrapper = () => {
  const getActiveContainer = () => {
    return activeField.value === 'name' ? nameFieldRef.value : valueFieldRef.value
  }
  handleViewportChange(getActiveContainer)
}

onMounted(() => {
  loadData()
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
          Новый рекорд
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
              @click="loadData"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              style="touch-action: manipulation;"
            >
              Попробовать снова
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div v-else class="flex-1 flex flex-col min-h-0">
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
                <p class="text-blue-800 font-medium">{{ exercise?.name }}</p>
              </div>
            </div>

            <!-- Record Name Input -->
            <div ref="nameFieldRef" class="mb-6" @click="handleNameClick">
              <h2 class="text-lg font-semibold text-gray-800 mb-2">Название рекорда</h2>
              <input
                ref="nameInputRef"
                v-model="newRecordName"
                type="text"
                inputmode="text"
                class="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg font-medium text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors capitalize"
                placeholder="Например: Максимальный вес"
                style="touch-action: manipulation;"
                @focus="handleNameFocus"
                @blur="handleInputBlur"
                @keypress="handleEnterKey"
              />
            </div>

            <!-- Measurement Unit Select -->
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-gray-800 mb-2">Единица измерения</h2>
              <select
                v-model="newRecordUnitId"
                class="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg font-medium text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                style="touch-action: manipulation;"
                @focus="isEditing = true"
                @blur="isEditing = false"
              >
                <option value="" disabled>Выберите единицу</option>
                <option 
                  v-for="unit in measurementUnits" 
                  :key="unit.id" 
                  :value="unit.id"
                >
                  {{ unit.name }}
                </option>
              </select>
            </div>

            <!-- Value Input -->
            <div ref="valueFieldRef" class="mb-6" @click="handleValueClick">
              <h2 class="text-lg font-semibold text-gray-800 mb-2">Значение</h2>
              <div class="relative">
                <input
                  ref="valueInputRef"
                  v-model="newRecordValue"
                  type="number"
                  step="0.01"
                  inputmode="decimal"
                  class="w-full px-5 py-6 border-2 border-gray-300 rounded-xl text-3xl font-bold text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                  placeholder="0"
                  style="touch-action: manipulation;"
                  @focus="handleValueFocus"
                  @blur="handleInputBlur"
                  @keypress="handleNumberKeypress"
                />
                <div class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-lg font-medium pointer-events-none">
                  {{ measurementUnits.find(u => u.id === newRecordUnitId?.toString())?.name || 'ед.' }}
                </div>
              </div>
            </div>
            
            <!-- Добавляем небольшой отступ для клавиатуры -->
            <div class="h-20"></div>
          </div>

          <!-- Fixed Action Buttons - скрываем в режиме редактирования на мобильных -->
          <div v-if="!isEditing || !isMobile" class="p-6 pt-4 border-t border-gray-100 bg-white">
            <button
              @click="saveNewRecord"
              :disabled="saving || !newRecordName.trim() || !newRecordValue || !newRecordUnitId"
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
