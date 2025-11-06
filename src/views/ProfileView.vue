<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTelegram } from '@/composables/useTelegram'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const { user: tgUser, hapticFeedback } = useTelegram()
const router = useRouter()

const name = computed(() => authStore.profile
  ? `${authStore.profile.first_name} ${authStore.profile.last_name || ''}`.trim()
  : `${tgUser.value?.first_name || ''} ${tgUser.value?.last_name || ''}`.trim()
)

const username = computed(() => authStore.profile?.username || tgUser.value?.username || '')

const handleEdit = () => {
  hapticFeedback('impact')
  router.push({ name: 'user-data' })
}
</script>

<template>
  <div class="tg-screen flex flex-col overflow-hidden select-none" style="overscroll-behavior: none; touch-action: none;">
    <div class="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto px-6">
      <div class="tg-safe-top pb-4 text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Профиль</h1>
      </div>

      <div class="flex-1 pb-8 flex flex-col min-h-0">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">
              {{ name ? name[0] : 'U' }}
            </div>
            <div class="min-w-0">
              <p class="text-lg font-semibold text-gray-900 truncate">{{ name || 'Без имени' }}</p>
              <p v-if="username" class="text-sm text-gray-500 truncate">@{{ username }}</p>
            </div>
          </div>

          <button
            @click="handleEdit"
            class="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 active:scale-95 transition-all"
            style="touch-action: manipulation;"
          >
            Редактировать данные
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


