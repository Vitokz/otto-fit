import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'
import AuthSuccessView from '../views/AuthSuccessView.vue'
import ExerciseDetailView from '../views/ExerciseDetailView.vue'
import MetconDetailView from '../views/MetconDetailView.vue'
import CommentDetailView from '../views/CommentDetailView.vue'
import AddCommentView from '../views/AddCommentView.vue'
import UserDataForm from '../components/UserDataForm.vue'
import WelcomeScreen from '../components/WelcomeScreen.vue'
import ExercisesList from '../components/ExercisesList.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/auth-success',
      name: 'auth-success',
      component: AuthSuccessView,
      meta: { requiresAuth: true }
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: WelcomeScreen,
      meta: { requiresAuth: true }
    },
    {
      path: '/user-data',
      name: 'user-data',
      component: UserDataForm,
      meta: { requiresAuth: true }
    },
    {
      path: '/category/:categoryId/exercises',
      name: 'category-exercises',
      component: ExercisesList,
      meta: { requiresAuth: true }
    },
    {
      path: '/exercise/:exerciseId',
      name: 'exercise-detail',
      component: ExerciseDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/metcon/:exerciseId',
      name: 'metcon-detail',
      component: MetconDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/comment/:commentId',
      name: 'comment-detail',
      component: CommentDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/exercise/:exerciseId/add-comment',
      name: 'add-comment',
      component: AddCommentView,
      meta: { requiresAuth: true }
    },
  ],
})
// Route guards для автоматической авторизации и перенаправления
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Ждем инициализации авторизации
  if (!authStore.profile) {
    await authStore.initialize(authStore.telegramUser!)
  }

  if (!authStore.isAuthenticated) {
    // Пользователь не авторизован, но это должно обрабатываться автоматически в App.vue
    // Просто ждем авторизации
    next()
    return
  }

  // Проверяем заполненность профиля только для основных маршрутов
  // Избегаем бесконечных редиректов
  if (!authStore.hasCompleteProfile && to.name !== 'welcome' && to.name !== 'user-data') {
    next({ name: 'welcome' })
    return
  }

  next()
})

export default router
