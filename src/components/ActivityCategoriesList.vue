<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useTelegram } from '@/composables/useTelegram'
import type { Database } from '@/types/database.types'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

type ActivityCategory = Database['public']['Tables']['activity_categories']['Row']

const router = useRouter()
const { hapticFeedback } = useTelegram()
const categories = ref<ActivityCategory[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const loadCategories = async () => {
  try {
    loading.value = true
    error.value = null
    
    const { data, error: fetchError } = await supabase
      .from('activity_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (fetchError) {
      throw fetchError
    }

    categories.value = data || []
  } catch (err: any) {
    console.error('Error loading categories:', err)
    error.value = err.message || 'Ошибка загрузки категорий'
  } finally {
    loading.value = false
  }
}

const selectCategory = (category: ActivityCategory) => {
  hapticFeedback('impact')
  router.push({
    name: 'category-exercises',
    params: { categoryId: category.id }
  })
}

onMounted(() => {
  loadCategories()
})
</script>

<template>
  <div class="tg-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden select-none" style="overscroll-behavior: none; touch-action: none;">
    <!-- Main centered container -->
    <div class="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto px-6">
      <!-- Header -->
      <div class="tg-safe-top pb-4 text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Категории упражнений</h1>
      </div>

      <!-- Categories List -->
      <div class="flex-1 pb-8 flex flex-col min-h-0">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-0">
        <!-- Loading State -->
        <LoadingSpinner v-if="loading" message="Загрузка категорий..." />

        <!-- Error State -->
        <div v-else-if="error" class="flex-1 flex items-center justify-center">
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">⚠️</span>
            </div>
            <p class="text-red-600 font-medium mb-2">Ошибка загрузки</p>
            <p class="text-gray-500 text-sm mb-4">{{ error }}</p>
            <button 
              @click="loadCategories"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              style="touch-action: manipulation;"
            >
              Попробовать снова
            </button>
          </div>
        </div>

        <!-- Categories -->
        <div v-else-if="categories.length > 0" class="p-6 overflow-y-auto space-y-4" style="touch-action: pan-y;">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="selectCategory(category)"
            class="w-full p-6 bg-gray-50 border border-gray-200 rounded-2xl text-left hover:bg-gray-100 active:scale-95 transition-all duration-200 group"
            style="touch-action: manipulation;"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {{ category.name }}
                </h3>
              </div>
              <div class="ml-4 flex items-center">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </button>
        </div>

        <!-- Empty State -->
        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center p-6">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">📋</span>
            </div>
            <p class="text-gray-500 font-medium mb-2">Категории не найдены</p>
            <p class="text-gray-400 text-sm">Категории упражнений пока не добавлены</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>
