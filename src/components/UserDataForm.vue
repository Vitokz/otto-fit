<script setup lang="ts">
import { ref } from 'vue'
import { useTelegram } from '@/composables/useTelegram'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const { hapticFeedback, showAlert, user: telegramUser } = useTelegram()
const authStore = useAuthStore()
const router = useRouter()

// Form data
const firstName = ref('')
const lastName = ref('')
const gender = ref('')
const height = ref('')
const weight = ref('')
const birthDate = ref('')

const handleSubmit = async () => {
  // Validate form
  if (!firstName.value || !lastName.value || !gender.value || !height.value || !weight.value || !birthDate.value) {
    hapticFeedback('error')
    showAlert('Пожалуйста, заполните все поля')
    return
  }

  // Validate height (120-250 cm)
  const heightNum = parseInt(height.value)
  if (isNaN(heightNum) || heightNum < 120 || heightNum > 250) {
    hapticFeedback('error')
    showAlert('Введите корректный рост (120-250 см)')
    return
  }

  // Validate weight (30-300 kg)
  const weightNum = parseFloat(weight.value)
  if (isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
    hapticFeedback('error')
    showAlert('Введите корректный вес (30-300 кг)')
    return
  }

  try {
    // Авторизуемся через Telegram если еще не авторизованы
    if (!authStore.isAuthenticated && telegramUser.value) {
      const authResult = await authStore.signInWithTelegram(telegramUser.value)

      if (!authResult.success) {
        hapticFeedback('error')
        showAlert('Ошибка авторизации: ' + authResult.error)
        return
      }
    }

    // Сохраняем профиль пользователя в Supabase
    const profileResult = await authStore.upsertProfile({
      first_name: firstName.value,
      last_name: lastName.value,
      gender: gender.value as 'male' | 'female',
      height: heightNum,
      weight: weightNum,
      birth_date: birthDate.value,
    })

    if (!profileResult.success) {
      hapticFeedback('error')
      showAlert('Ошибка сохранения данных: ' + profileResult.error)
      return
    }

    hapticFeedback('success')
    showAlert('Данные сохранены! 🎉')
    
    // Navigate to main app
    router.push('/')
  } catch (error) {
    console.error('Error saving user data:', error)
    hapticFeedback('error')
    showAlert('Произошла ошибка при сохранении данных')
  }
}

const goBack = () => {
  hapticFeedback('impact')
  router.back()
}
</script>

<template>
  <div class="fixed inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden select-none" style="overscroll-behavior: none; touch-action: none;">
    <!-- Header -->
    <div class="pt-20 pb-4 px-6">
      <h1 class="text-2xl font-bold text-gray-900">Введите свои данные</h1>
    </div>

    <!-- Form -->
    <div class="flex-1 px-6 pb-8 flex flex-col min-h-0">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
        <div class="p-6 overflow-y-auto space-y-6" style="touch-action: pan-y;">
          <!-- Name -->
          <div>
            <label class="block text-lg font-semibold text-gray-900 mb-3">
              Имя
            </label>
            <input 
              v-model="firstName"
              type="text"
              placeholder="Введите ваше имя"
              class="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style="touch-action: manipulation;"
            />
          </div>

          <!-- Surname -->
          <div>
            <label class="block text-lg font-semibold text-gray-900 mb-3">
              Фамилия
            </label>
            <input 
              v-model="lastName"
              type="text"
              placeholder="Введите вашу фамилию"
              class="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style="touch-action: manipulation;"
            />
          </div>

          <!-- Gender -->
          <div>
            <label class="block text-lg font-semibold text-gray-900 mb-3">
              Пол
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button
                @click="gender = 'male'"
                :class="[
                  'px-4 py-4 rounded-xl text-lg font-medium transition-all flex items-center justify-center min-h-[60px]',
                  gender === 'male' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                ]"
                style="touch-action: manipulation;"
              >
                <span class="flex items-center gap-2">
                  <span>👨</span>
                  <span>Мужской</span>
                </span>
              </button>
              <button
                @click="gender = 'female'"
                :class="[
                  'px-4 py-4 rounded-xl text-lg font-medium transition-all flex items-center justify-center min-h-[60px]',
                  gender === 'female' 
                    ? 'bg-pink-500 text-white shadow-md' 
                    : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                ]"
                style="touch-action: manipulation;"
              >
                <span class="flex items-center gap-2">
                  <span>👩</span>
                  <span>Женский</span>
                </span>
              </button>
            </div>
          </div>

          <!-- Height -->
          <div>
            <label class="block text-lg font-semibold text-gray-900 mb-3">
              Рост
            </label>
            <div class="relative">
              <input 
                v-model="height"
                type="number"
                inputmode="numeric"
                placeholder="175"
                min="120"
                max="250"
                class="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                style="touch-action: manipulation;"
              />
              <span class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                см
              </span>
            </div>
          </div>

          <!-- Weight -->
          <div>
            <label class="block text-lg font-semibold text-gray-900 mb-3">
              Вес
            </label>
            <div class="relative">
              <input 
                v-model="weight"
                type="number"
                inputmode="decimal"
                step="0.1"
                placeholder="70"
                min="30"
                max="300"
                class="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                style="touch-action: manipulation;"
              />
              <span class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                кг
              </span>
            </div>
          </div>

          <!-- Birth Date -->
          <div>
            <label class="block text-lg font-semibold text-gray-900 mb-3">
              Дата рождения
            </label>
            <input 
              v-model="birthDate"
              type="date"
              class="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              style="touch-action: manipulation; color-scheme: light;"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="px-6 pb-8">
      <button 
        @click="handleSubmit"
        class="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform text-lg"
        style="touch-action: manipulation;"
      >
        Готово! 🎉
      </button>
    </div>
  </div>
</template>
