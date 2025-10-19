<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useTelegram } from '@/composables/useTelegram'
import { useFormKeyboard } from '@/composables/useFormKeyboard'
import type { Database } from '@/types/database.types'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

type ExerciseComment = Database['public']['Tables']['exercise_comments']['Row']

const route = useRoute()
const router = useRouter()
const { hapticFeedback, user } = useTelegram()
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

const comment = ref<ExerciseComment | null>(null)
const editedDescription = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const showCompleteModal = ref(false)
const descriptionTextareaRef = ref<HTMLTextAreaElement | null>(null)
const descriptionFieldRef = ref<HTMLDivElement | null>(null)

const commentId = route.params.commentId as string

const loadComment = async () => {
  try {
    loading.value = true
    error.value = null
    
    if (!user.value?.id) {
      throw new Error('Пользователь не авторизован')
    }

    const { data: commentData, error: commentError } = await supabase
      .from('exercise_comments')
      .select('*')
      .eq('id', commentId)
      .eq('user_id', user.value.id)
      .single()

    if (commentError) {
      throw commentError
    }

    comment.value = commentData
    editedDescription.value = commentData.description || ''
  } catch (err: any) {
    console.error('Error loading comment:', err)
    error.value = err.message || 'Ошибка загрузки замечания'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  hapticFeedback('impact')
  router.back()
}

const openCompleteModal = () => {
  hapticFeedback('impact')
  showCompleteModal.value = true
}

const closeCompleteModal = () => {
  hapticFeedback('impact')
  showCompleteModal.value = false
}

const saveComment = async () => {
  if (!comment.value || !user.value?.id) return
  
  try {
    saving.value = true
    hapticFeedback('impact')

    const { error: updateError } = await supabase
      .from('exercise_comments')
      .update({ 
        description: editedDescription.value.trim() || null
      })
      .eq('id', comment.value.id)
      .eq('user_id', user.value.id)

    if (updateError) {
      throw updateError
    }

    // Обновляем локальные данные
    if (comment.value) {
      comment.value.description = editedDescription.value.trim() || null
    }

    hapticFeedback('success')
    goBack()
  } catch (err: any) {
    console.error('Error saving comment:', err)
    hapticFeedback('error')
    // TODO: Show error message to user
  } finally {
    saving.value = false
  }
}

const completeComment = async () => {
  if (!comment.value || !user.value?.id) return
  
  try {
    showCompleteModal.value = false
    saving.value = true
    hapticFeedback('impact')

    const { error: updateError } = await supabase
      .from('exercise_comments')
      .update({ 
        state: 'completed',
        description: editedDescription.value.trim() || null
      })
      .eq('id', comment.value.id)
      .eq('user_id', user.value.id)

    if (updateError) {
      throw updateError
    }

    hapticFeedback('success')
    goBack()
  } catch (err: any) {
    console.error('Error completing comment:', err)
    hapticFeedback('error')
    // TODO: Show error message to user
  } finally {
    saving.value = false
  }
}

// Создаем обработчики для поля
const handleDescriptionFocus = () => {
  handleFieldFocus('description', descriptionFieldRef.value)
}

const handleDescriptionClick = createFieldClickHandler(descriptionTextareaRef)

// Создаем обработчик клика по контейнеру
const handleContainerClick = createContainerClickHandler(
  [descriptionTextareaRef], 
  [descriptionFieldRef]
)

// Создаем обработчик изменения viewport
const handleViewportChangeWrapper = () => {
  const getActiveContainer = () => descriptionFieldRef.value
  handleViewportChange(getActiveContainer)
}

onMounted(() => {
  loadComment()
  
  // Слушаем изменения размера окна и высоты viewport
  window.addEventListener('resize', handleViewportChangeWrapper)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleViewportChangeWrapper)
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
          Замечание
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
              @click="loadComment"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              style="touch-action: manipulation;"
            >
              Попробовать снова
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div v-else-if="comment" class="flex-1 flex flex-col min-h-0">
          <!-- Scrollable Content -->
          <div class="flex-1 overflow-y-auto p-6" style="touch-action: pan-y;" @click="handleContainerClick">
            <!-- Comment Title -->
            <div class="mb-6">
              <h2 class="text-lg font-semibold text-gray-800 mb-2">Краткое название</h2>
              <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p class="text-blue-800 font-medium">{{ comment.short_name }}</p>
              </div>
            </div>

            <!-- Description Editor -->
            <div ref="descriptionFieldRef" class="mb-6" @click="handleDescriptionClick">
              <h3 class="text-lg font-semibold text-gray-800 mb-3">Описание</h3>
              <textarea
                ref="descriptionTextareaRef"
                v-model="editedDescription"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors resize-none"
                placeholder="Добавьте подробное описание замечания..."
                style="touch-action: manipulation; min-height: 200px;"
                enterkeyhint="done"
                @focus="handleDescriptionFocus"
                @blur="handleInputBlur"
                @keypress="handleEnterKey"
              ></textarea>
            </div>

            <!-- Добавляем небольшой отступ для клавиатуры -->
            <div class="h-20"></div>
          </div>

          <!-- Complete Button -->
          <div v-if="!isEditing || !isMobile" class="px-6 pb-4">
            <button
              @click="openCompleteModal"
              :disabled="saving"
              class="w-full py-4 bg-green-500 text-white rounded-2xl font-semibold hover:bg-green-600 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style="touch-action: manipulation;"
            >
              <div v-if="saving" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {{ saving ? 'Завершение...' : 'Завершить' }}
            </button>
          </div>

          <!-- Fixed Action Buttons - скрываем в режиме редактирования на мобильных -->
          <div v-if="!isEditing || !isMobile" class="p-6 pt-4 border-t border-gray-100 bg-white">
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
                @click="saveComment"
                :disabled="saving"
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

    <!-- Complete Confirmation Modal -->
    <div 
      v-if="showCompleteModal" 
      class="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 p-4"
      @click="closeCompleteModal"
      style="touch-action: none;"
    >
      <div 
        @click.stop
        class="bg-white rounded-2xl p-6 w-full max-w-sm mx-auto shadow-xl"
        style="touch-action: manipulation;"
      >
        <!-- Modal Header -->
        <div class="flex justify-center mb-6">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">✅</span>
          </div>
        </div>

        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-gray-900 mb-2">Завершить замечание?</h2>
          <p class="text-gray-600 text-sm leading-relaxed">
            Это замечание будет считаться проработанным и более не будет отображаться в списке активных замечаний.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 pt-8">
          <button
            @click="closeCompleteModal"
            :disabled="saving"
            class="flex-1 py-3 px-4 bg-gray-100 text-gray-800 rounded-xl font-semibold hover:bg-gray-200 active:scale-95 transition-all duration-200 disabled:opacity-50"
            style="touch-action: manipulation;"
          >
            Отмена
          </button>
          <button
            @click="completeComment"
            :disabled="saving"
            class="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            style="touch-action: manipulation;"
          >
            <div v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            {{ saving ? 'Завершение...' : 'Завершить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
