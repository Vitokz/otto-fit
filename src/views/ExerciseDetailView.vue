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

// Edit Modal state
const showEditModal = ref(false)
const editingRecord = ref<ExerciseRecord | null>(null)
const editValue = ref<number | null>(null)
const saving = ref(false)

// Add Record Modal state
const showAddRecordModal = ref(false)
const newRecordName = ref('')
const newRecordValue = ref('')
const newRecordUnitId = ref<number | null>(null)
const addingSaving = ref(false)

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
  router.back()
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
    openAddRecordModal()
  } else {
    addComment()
  }
}

const openAddRecordModal = () => {
  hapticFeedback('impact')
  newRecordName.value = ''
  newRecordValue.value = ''
  newRecordUnitId.value = null
  showAddRecordModal.value = true
}

const closeAddRecordModal = () => {
  hapticFeedback('impact')
  showAddRecordModal.value = false
  newRecordName.value = ''
  newRecordValue.value = ''
  newRecordUnitId.value = null
  addingSaving.value = false
}

const saveNewRecord = async () => {
  if (!user.value?.id || !newRecordName.value.trim() || !newRecordValue.value || !newRecordUnitId.value) return
  
  try {
    addingSaving.value = true
    hapticFeedback('impact')
    
    const value = parseFloat(newRecordValue.value)
    if (isNaN(value)) {
      throw new Error('Некорректное значение')
    }

    const { data: newRecord, error: insertError } = await supabase
      .from('exercise_records')
      .insert({
        exercise_id: exerciseId,
        user_id: user.value.id,
        name: newRecordName.value.trim(),
        value: value,
        measure_unit_id: newRecordUnitId.value.toString(),
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

    // Добавляем новый рекорд в локальный список
    if (newRecord) {
      records.value.unshift(newRecord)
    }

    closeAddRecordModal()
  } catch (err: any) {
    console.error('Error saving new record:', err)
    hapticFeedback('error')
    // TODO: Show error message to user
  } finally {
    addingSaving.value = false
  }
}

const openEditModal = (record: ExerciseRecord) => {
  hapticFeedback('impact')
  editingRecord.value = record
  editValue.value = record.value
  showEditModal.value = true
}

const closeEditModal = () => {
  hapticFeedback('impact')
  showEditModal.value = false
  editingRecord.value = null
  editValue.value = null
  saving.value = false
}

const saveRecord = async () => {
  if (!editingRecord.value || !user.value?.id || editValue.value === null) return
  
  try {
    saving.value = true
    hapticFeedback('impact')
    
    const newValue = editValue.value
    if (isNaN(newValue)) {
      throw new Error('Некорректное значение')
    }

    const { error: updateError } = await supabase
      .from('exercise_records')
      .update({ value: newValue })
      .eq('id', editingRecord.value.id)
      .eq('user_id', user.value.id)

    if (updateError) {
      throw updateError
    }

    // Обновляем локальные данные
    const recordIndex = records.value.findIndex(r => r.id === editingRecord.value!.id)
    if (recordIndex !== -1) {
      records.value[recordIndex].value = newValue
    }

    closeEditModal()
  } catch (err: any) {
    console.error('Error saving record:', err)
    hapticFeedback('error')
    // TODO: Show error message to user
  } finally {
    saving.value = false
  }
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
                    @click="openEditModal(record)"
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
          <h2 class="text-xl font-bold text-gray-900">Редактировать рекорд</h2>
        </div>

        <!-- Record Name -->
        <div class="text-center mb-12 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p class="text-black text-lg font-bold leading-tight break-words">{{ editingRecord?.name }}</p>
        </div>

        <!-- Value Input -->
        <div class="mb-6">
          <label class="block text-base font-semibold text-gray-800 mb-3">
            Значение
          </label>
          <div class="relative">
            <input
              v-model="editValue"
              type="number"
              step="0.01"
              class="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-xl font-bold text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
              :placeholder="editingRecord?.value?.toString()"
              style="touch-action: manipulation;"
              @focus="($event.target as HTMLInputElement)?.select()"
            />
            <div class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 text-base font-medium">
              {{ editingRecord?.measurement_units?.name || 'ед.' }}
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
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Record Modal -->
    <div 
      v-if="showAddRecordModal" 
      class="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 p-4"
      @click="closeAddRecordModal"
      style="touch-action: none;"
    >
      <div 
        @click.stop
        class="bg-white rounded-2xl p-8 w-full max-w-sm mx-auto shadow-xl min-h-[400px] flex flex-col"
        style="touch-action: manipulation;"
      >
        <!-- Modal Header -->
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">Добавить рекорд</h2>
        </div>

        <!-- Record Name Input -->
        <div class="mb-6">
          <label class="block text-base font-semibold text-gray-800 mb-3">
            Название рекорда
          </label>
          <input
            v-model="newRecordName"
            type="text"
            class="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg font-medium text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors capitalize"
            placeholder="Например: Максимальный вес"
            style="touch-action: manipulation;"
            @focus="($event.target as HTMLInputElement)?.select()"
          />
        </div>

        <!-- Measurement Unit Select -->
        <div class="mb-6">
          <label class="block text-base font-semibold text-gray-800 mb-3">
            Единица измерения
          </label>
          <select
            v-model="newRecordUnitId"
            class="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg font-medium text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
            style="touch-action: manipulation;"
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
        <div class="mb-6">
          <label class="block text-base font-semibold text-gray-800 mb-3">
            Значение
          </label>
          <input
            v-model="newRecordValue"
            type="number"
            step="0.01"
            class="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-xl font-bold text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
            placeholder="0"
            style="touch-action: manipulation;"
            @focus="($event.target as HTMLInputElement)?.select()"
          />
        </div>

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Action Buttons Container -->
        <div class="pt-8">
          <div class="flex gap-4">
            <button
              @click="closeAddRecordModal"
              :disabled="addingSaving"
              class="flex-1 py-4 px-5 bg-gray-100 text-gray-800 rounded-xl font-bold text-base hover:bg-gray-200 active:scale-95 transition-all duration-200 disabled:opacity-50"
              style="touch-action: manipulation;"
            >
              Отмена
            </button>
            <button
              @click="saveNewRecord"
              :disabled="addingSaving || !newRecordName.trim() || !newRecordValue || !newRecordUnitId"
              class="flex-1 py-4 px-5 bg-blue-500 text-white rounded-xl font-bold text-base hover:bg-blue-600 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style="touch-action: manipulation;"
            >
              <div v-if="addingSaving" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {{ addingSaving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
