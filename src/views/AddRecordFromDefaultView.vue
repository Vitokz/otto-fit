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
type DefaultRecord = Database['public']['Tables']['exercise_default_records']['Row'] & {
  measurement_units?: { name: string }
}

const route = useRoute()
const router = useRouter()
const { hapticFeedback, user } = useTelegram()
const { setupBackButton, removeBackButton } = useTelegramBackButton()
const {
  isEditing,
  activeField,
  handleFieldFocus,
  createFieldClickHandler,
  handleInputBlur,
  createContainerClickHandler,
  handleViewportChange,
  handleNumberKeypress
} = useFormKeyboard()

const exercise = ref<Exercise | null>(null)
const def = ref<DefaultRecord | null>(null)
const newRecordValue = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const valueInputRef = ref<HTMLInputElement | null>(null)
const valueFieldRef = ref<HTMLDivElement | null>(null)
const scrollContainerRef = ref<HTMLDivElement | null>(null)

const exerciseId = route.params.exerciseId as string
const defaultId = route.params.defaultId as string

const loadData = async () => {
  try {
    loading.value = true
    error.value = null

    const [{ data: exerciseData, error: exerciseError }, { data: defData, error: defError }] = await Promise.all([
      supabase.from('exercises').select('*').eq('id', exerciseId).single(),
      supabase
        .from('exercise_default_records')
        .select('*, measurement_units ( name )')
        .eq('id', defaultId)
        .single()
    ])

    if (exerciseError) throw exerciseError
    if (defError) throw defError

    exercise.value = exerciseData
    def.value = defData as DefaultRecord
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

const saveRecordFromDefault = async () => {
  if (!user.value?.id || !def.value) return

  try {
    saving.value = true
    hapticFeedback('impact')

    const value = parseFloat(newRecordValue.value)
    if (isNaN(value)) throw new Error('Некорректное значение')

    const { error: insertError } = await supabase.from('exercise_records').insert({
      exercise_id: exerciseId,
      user_id: user.value.id,
      name: def.value.name,
      value,
      measure_unit_id: def.value.measure_unit_id,
      state: 'current',
      default_record_id: def.value.id
    })

    if (insertError) throw insertError

    hapticFeedback('success')
    router.replace({ name: 'exercise-detail', params: { exerciseId }, query: { tab: 'records', from: route.query.from as string | undefined } })
  } catch (err: any) {
    console.error('Error saving record from default:', err)
    hapticFeedback('error')
  } finally {
    saving.value = false
  }
}

const handleValueFocus = () => {
  handleFieldFocus('value', valueFieldRef.value)
}

const handleValueClick = createFieldClickHandler(valueInputRef)
const handleContainerClick = createContainerClickHandler([valueInputRef], [valueFieldRef])

const handleViewportChangeWrapper = () => {
  const getActiveContainer = () => (activeField.value === 'value' ? valueFieldRef.value : null)
  handleViewportChange(getActiveContainer)
}

onMounted(() => {
  loadData()
  setupBackButton(goBack)
  window.addEventListener('resize', handleViewportChangeWrapper)
})

onUnmounted(() => {
  removeBackButton()
  window.removeEventListener('resize', handleViewportChangeWrapper)
})
</script>

<template>
  <div class="tg-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden select-none" style="overscroll-behavior: none; touch-action: none;">
    <div class="tg-safe-top pb-4 px-6">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900">Новый рекорд из дефолта</h1>
      </div>
    </div>

    <div class="flex-1 px-6 pb-8 flex flex-col min-h-0">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
        <LoadingSpinner v-if="loading" />

        <div v-else-if="error" class="flex-1 flex items-center justify-center">
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">⚠️</span>
            </div>
            <p class="text-red-600 font-medium mb-2">Ошибка загрузки</p>
            <p class="text-gray-500 text-sm mb-4">{{ error }}</p>
            <button @click="loadData" class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors" style="touch-action: manipulation;">Попробовать снова</button>
          </div>
        </div>

        <div v-else class="flex-1 flex flex-col min-h-0">
          <div ref="scrollContainerRef" class="flex-1 overflow-y-auto p-6" style="touch-action: pan-y;" @click="handleContainerClick">
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-gray-800 mb-2">Упражнение</h2>
              <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p class="text-blue-800 font-medium">{{ exercise?.name }}</p>
              </div>
            </div>

            <div class="mb-6">
              <h2 class="text-lg font-semibold text-gray-800 mb-2">Название рекорда</h2>
              <div class="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                <p class="text-gray-900 font-medium">{{ def?.name }}</p>
              </div>
            </div>

            <div class="mb-6">
              <h2 class="text-lg font-semibold text-gray-800 mb-2">Единица измерения</h2>
              <div class="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                <p class="text-gray-900 font-medium">{{ def?.measurement_units?.name || 'ед.' }}</p>
              </div>
            </div>

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
                  {{ def?.measurement_units?.name || 'ед.' }}
                </div>
              </div>
            </div>

            <div class="h-20"></div>
          </div>

          <div v-if="!isEditing" class="p-6 pt-4 border-t border-gray-100 bg-white">
            <button
              @click="saveRecordFromDefault"
              :disabled="saving || !newRecordValue"
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


