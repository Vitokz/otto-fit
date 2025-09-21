import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'
import UserDataForm from '../components/UserDataForm.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true, requiresCompleteProfile: true }
    },
    {
      path: '/user-data',
      name: 'user-data',
      component: UserDataForm,
      meta: { requiresAuth: true }
    },
  ],
})

// Route guards для автоматической авторизации и перенаправления
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Ждем инициализации авторизации
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresCompleteProfile = to.matched.some(record => record.meta.requiresCompleteProfile)

  if (requiresAuth && !authStore.isAuthenticated) {
    // Пользователь не авторизован, но это должно обрабатываться автоматически в App.vue
    // Просто ждем авторизации
    next()
    return
  }

  if (requiresCompleteProfile && authStore.isAuthenticated) {
    // Проверяем завершенность профиля
    if (!authStore.profile?.profile_completed && to.name !== 'user-data') {
      next({ name: 'user-data' })
      return
    }
    
    // Если профиль завершен, но пользователь на странице заполнения данных
    if (authStore.profile?.profile_completed && to.name === 'user-data') {
      next({ name: 'home' })
      return
    }
  }

  next()
})

export default router
