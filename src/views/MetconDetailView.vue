<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useTelegram } from '@/composables/useTelegram'
import type { Database } from '@/types/database.types'

type MetconExercise = Database['public']['Tables']['metcon_exercises']['Row']
type MetconRecord = Database['public']['Tables']['metcon_exercise_records']['Row'] & {
  measurement_units?: { name: string }
}
type MeasurementUnit = Database['public']['Tables']['measurement_units']['Row']

const route = useRoute()
const router = useRouter()
const { hapticFeedback, user } = useTelegram()

const metcon = ref<MetconExercise | null>(null)
const record = ref<MetconRecord | null>(null)
const measurementUnits = ref<MeasurementUnit[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showDescription = ref(false)
const showEditModal = ref(false)
const editValue = ref<number | null>(null)
const saving = ref(false)

const metconId = route.params.exerciseId as string

const loadMetconData = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Загружаем меткон
    const { data: metconData, error: metconError } = await supabase
      .from('metcon_exercises')
      .select('*')
      .eq('id', metconId)
      .single()

    if (metconError) {
      throw metconError
    }

    metcon.value = metconData

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
      // Загружаем рекорд пользователя для этого меткона
      const { data: recordData, error: recordError } = await supabase
        .from('metcon_exercise_records')
        .select(`
          *,
          measurement_units (
            name
          )
        `)
        .eq('metcon_exercise_id', metconId)
        .eq('user_id', user.value.id)
        .single()

      if (recordError && recordError.code !== 'PGRST116') {
        console.error('Error loading metcon record:', recordError)
      } else {
        record.value = recordData
      }
    }
  } catch (err: any) {
    console.error('Error loading metcon data:', err)
    error.value = err.message || 'Ошибка загрузки меткона'
  } finally {
    loading.value = false
  }
}

const toggleDescription = () => {
  hapticFeedback('impact')
  showDescription.value = !showDescription.value
}

const goBack = () => {
  hapticFeedback('impact')
  router.back()
}

const openEditModal = () => {
  hapticFeedback('impact')
  editValue.value = record.value?.value || null
  showEditModal.value = true
}

const closeEditModal = () => {
  hapticFeedback('impact')
  showEditModal.value = false
  editValue.value = null
  saving.value = false
}

const saveRecord = async () => {
  if (!user.value?.id || editValue.value === null) return
  
  try {
    saving.value = true
    hapticFeedback('impact')
    
    const newValue = editValue.value
    if (isNaN(newValue)) {
      throw new Error('Некорректное значение')
    }

    if (record.value) {
      // Обновляем существующий рекорд
      const { error: updateError } = await supabase
        .from('metcon_exercise_records')
        .update({ value: newValue })
        .eq('id', record.value.id)
        .eq('user_id', user.value.id)

      if (updateError) {
        throw updateError
      }

      // Обновляем локальные данные
      record.value.value = newValue
    } else {
      // Создаем новый рекорд
      const { data: newRecord, error: insertError } = await supabase
        .from('metcon_exercise_records')
        .insert({
          metcon_exercise_id: metconId,
          user_id: user.value.id,
          value: newValue,
          measure_unit_id: metcon.value?.measure_unit_id || '',
          state: 'current'
        })
        .select(`
          *,
          measurement_units (
            name
          )
        `)
        .single()

      if (insertError) {
        throw insertError
      }

      record.value = newRecord
    }

    closeEditModal()
  } catch (err: any) {
    console.error('Error saving metcon record:', err)
    hapticFeedback('error')
    // TODO: Show error message to user
  } finally {
    saving.value = false
  }
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
  loadMetconData()
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
      
      <!-- Metcon Title -->
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ metcon?.name || 'Меткон' }}
        </h1>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 px-6 pb-8 flex flex-col min-h-0">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
        <!-- Loading State -->
        <div v-if="loading" class="flex-1 flex items-center justify-center">
          <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
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
              @click="loadMetconData"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              style="touch-action: manipulation;"
            >
              Попробовать снова
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div v-else class="flex-1 flex flex-col min-h-0">
          <!-- Description Toggle -->
          <div class="p-6 pb-0">
            <button
              @click="toggleDescription"
              class="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-left hover:bg-gray-100 active:scale-95 transition-all duration-200"
              style="touch-action: manipulation;"
            >
              <div class="flex items-center justify-between">
                <span class="text-lg font-semibold text-gray-900">Описание</span>
                <svg 
                  :class="['w-5 h-5 text-blue-600 transition-transform duration-200', showDescription ? 'rotate-180' : '']"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </button>
          </div>

          <!-- Description Content -->
          <div v-if="showDescription" class="px-6 pt-4">
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
              <p class="text-gray-700 leading-relaxed">{{ metcon?.description }}</p>
            </div>
          </div>

          <!-- Record Section -->
          <div class="flex-1 p-6 pt-4">
            <div class="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <div class="text-center">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Ваш рекорд</h3>
                
                <div v-if="record" class="mb-6">
                  <div class="text-4xl font-bold text-blue-600 mb-2">{{ record.value }}</div>
                  <div class="text-sm text-gray-500">{{ record.measurement_units?.name || 'ед.' }}</div>
                </div>
                
                <div v-else class="mb-6">
                  <div class="text-2xl text-gray-400">Нет рекорда</div>
                  <div class="text-sm text-gray-400">Добавьте свой первый результат</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="p-6 pt-0">
            <div class="flex gap-4">
              <button
                @click="goBack"
                class="flex-1 py-4 bg-gray-100 text-gray-800 rounded-2xl font-semibold hover:bg-gray-200 active:scale-95 transition-all duration-200"
                style="touch-action: manipulation;"
              >
                Назад
              </button>
              <button
                @click="openEditModal"
                class="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-600 active:scale-95 transition-all duration-200"
                style="touch-action: manipulation;"
              >
                {{ record ? 'Обновить рекорд' : 'Добавить рекорд' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Record Modal -->
    <div 
      v-if="showEditModal" 
      class="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 p-4"
      @click="closeEditModal"
      style="touch-action: none;"
    >
      <div 
        @click.stop
        class="bg-white rounded-2xl p-8 w-full max-w-sm mx-auto shadow-xl min-h-[320px] flex flex-col"
        style="touch-action: manipulation;"
      >
        <!-- Modal Header -->
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">{{ record ? 'Обновить рекорд' : 'Добавить рекорд' }}</h2>
        </div>

        <!-- Metcon Name -->
        <div class="text-center mb-12 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p class="text-gray-900 text-lg font-bold leading-tight break-words">{{ metcon?.name }}</p>
        </div>

        <!-- Value Input -->
        <div class="mb-6">
          <label class="block text-base font-semibold text-gray-800 mb-3">
            Время/Результат
          </label>
          <div class="relative">
            <input
              v-model="editValue"
              type="number"
              step="0.01"
              class="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-xl font-bold text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
              :placeholder="record?.value?.toString() || '0'"
              style="touch-action: manipulation;"
              @focus="($event.target as HTMLInputElement)?.select()"
              @keypress="handleNumberKeypress"
            />
            <div class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-base font-medium">
              {{ record?.measurement_units?.name || measurementUnits.find(u => u.id === metcon?.measure_unit_id)?.name || 'мин.' }}
            </div>
          </div>
        </div>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Action Buttons Container -->
        <div class="pt-8">
          <div class="flex gap-4">
            <button
              @click="closeEditModal"
              :disabled="saving"
              class="flex-1 py-4 px-5 bg-gray-100 text-gray-800 rounded-xl font-bold text-base hover:bg-gray-200 active:scale-95 transition-all duration-200 disabled:opacity-50"
              style="touch-action: manipulation;"
            >
              Отмена
            </button>
            <button
              @click="saveRecord"
              :disabled="saving || editValue === null"
              class="flex-1 py-4 px-5 bg-blue-500 text-white rounded-xl font-bold text-base hover:bg-blue-600 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style="touch-action: manipulation;"
            >
              <div v-if="saving" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {{ saving ? 'Сохранение...' : (record ? 'Обновить' : 'Добавить') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
