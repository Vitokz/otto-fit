<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTelegram } from '@/composables/useTelegram'

const authStore = useAuthStore()
const { user: tgUser } = useTelegram()

const name = computed(() => authStore.profile
  ? `${authStore.profile.first_name} ${authStore.profile.last_name || ''}`.trim()
  : `${tgUser.value?.first_name || ''} ${tgUser.value?.last_name || ''}`.trim()
)

const username = computed(() => authStore.profile?.username || tgUser.value?.username || '')
</script>

<template>
  <div class="tg-screen flex flex-col overflow-hidden select-none" style="overscroll-behavior: none; touch-action: none;">
    <div class="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto px-6">
      <div class="tg-safe-top pb-4 text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Профиль</h1>
      </div>

      <div class="flex-1 pb-8 flex flex-col min-h-0">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">
              {{ name ? name[0] : 'U' }}
            </div>
            <div class="min-w-0">
              <p class="text-lg font-semibold text-gray-900 truncate">{{ name || 'Без имени' }}</p>
              <p v-if="username" class="text-sm text-gray-500 truncate">@{{ username }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


