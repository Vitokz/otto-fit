<script setup lang="ts">
interface Props {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  message: 'Загрузка...',
  size: 'md'
})

const sizeClasses = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-4', 
  lg: 'w-16 h-16 border-4'
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center">
    <div 
      :class="[
        sizeClasses[size],
        'border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4'
      ]"
    ></div>
    <p class="text-gray-500">{{ message }}</p>
  </div>
</template>
