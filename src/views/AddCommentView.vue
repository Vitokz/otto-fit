<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useTelegram } from '@/composables/useTelegram'
import { useTelegramBackButton } from '@/composables/useTelegramBackButton'
import { useFormKeyboard } from '@/composables/useFormKeyboard'

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

const shortName = ref('')
const description = ref('')
const saving = ref(false)
const error = ref<string | null>(null)
const shortNameInputRef = ref<HTMLInputElement | null>(null)
const descriptionTextareaRef = ref<HTMLTextAreaElement | null>(null)
const shortNameFieldRef = ref<HTMLDivElement | null>(null)
const descriptionFieldRef = ref<HTMLDivElement | null>(null)

const exerciseId = route.params.exerciseId as string

const goBack = () => {
  hapticFeedback('impact')
  // Переходим на страницу упражнения с вкладкой "comments"
  router.push({ 
    name: 'exercise-detail', 
    params: { exerciseId: exerciseId }, 
    query: { tab: 'comments', from: route.query.from as string | undefined } 
  })
}

const saveComment = async () => {
  if (!user.value?.id || !shortName.value.trim()) return
  
  try {
    saving.value = true
    error.value = null
    hapticFeedback('impact')

    const { error: insertError } = await supabase
      .from('exercise_comments')
      .insert({
        exercise_id: exerciseId,
        user_id: user.value.id,
        short_name: shortName.value.trim(),
        description: description.value.trim() || null,
        state: 'active'
      })

    if (insertError) {
      throw insertError
    }

    hapticFeedback('success')
    goBack()
  } catch (err: any) {
    console.error('Error saving comment:', err)
    error.value = err.message || 'Ошибка сохранения замечания'
    hapticFeedback('error')
  } finally {
    saving.value = false
  }
}

// Создаем обработчики для полей
const handleShortNameFocus = () => {
  handleFieldFocus('shortName', shortNameFieldRef.value)
}

const handleDescriptionFocus = () => {
  handleFieldFocus('description', descriptionFieldRef.value)
}

const handleShortNameClick = createFieldClickHandler(shortNameInputRef)
const handleDescriptionClick = createFieldClickHandler(descriptionTextareaRef)

// Создаем обработчик клика по контейнеру
const handleContainerClick = createContainerClickHandler(
  [shortNameInputRef, descriptionTextareaRef], 
  [shortNameFieldRef, descriptionFieldRef]
)

// Создаем обработчик изменения viewport
const handleViewportChangeWrapper = () => {
  const getActiveContainer = () => {
    return activeField.value === 'shortName' ? shortNameFieldRef.value : descriptionFieldRef.value
  }
  handleViewportChange(getActiveContainer)
}

onMounted(() => {
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
          Добавить замечание
        </h1>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 px-6 pb-8 flex flex-col min-h-0">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
        <!-- Main Content -->
        <div class="flex-1 flex flex-col min-h-0">
          <!-- Scrollable Content -->
          <div class="flex-1 overflow-y-auto p-6" style="touch-action: pan-y;" @click="handleContainerClick">
            <!-- Short Name Input -->
            <div ref="shortNameFieldRef" class="mb-6" @click="handleShortNameClick">
              <h2 class="text-lg font-semibold text-gray-800 mb-2">Краткое название</h2>
              <input
                ref="shortNameInputRef"
                v-model="shortName"
                type="text"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-base text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
                placeholder="Введите краткое название замечания..."
                style="touch-action: manipulation;"
                maxlength="100"
                enterkeyhint="next"
                @focus="handleShortNameFocus"
                @blur="handleInputBlur"
                @keypress="handleEnterKey"
              />
            </div>

            <!-- Description Editor -->
            <div ref="descriptionFieldRef" class="mb-6" @click="handleDescriptionClick">
              <h3 class="text-lg font-semibold text-gray-800 mb-3">Описание</h3>
              <textarea
                ref="descriptionTextareaRef"
                v-model="description"
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

          <!-- Error Message -->
          <div v-if="error" class="px-6 pb-4">
            <div class="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p class="text-red-600 text-sm">{{ error }}</p>
            </div>
          </div>

          <!-- Fixed Action Buttons - скрываем в режиме редактирования на мобильных -->
          <div v-if="!isEditing || !isMobile" class="p-6 pt-4 border-t border-gray-100 bg-white">
            <button
              @click="saveComment"
              :disabled="saving || !shortName.trim()"
              class="w-full py-4 px-5 bg-blue-500 text-white rounded-xl font-bold text-base hover:bg-blue-600 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style="touch-action: manipulation;"
            >
              <div v-if="saving" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {{ saving ? 'Сохранение...' : 'Добавить' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
