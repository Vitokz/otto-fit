import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase, type UserProfile, type UserProfileInsert } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const profile = ref<UserProfile | null>(null)
    const loading = ref(false)
    const initialized = ref(false)

    const isAuthenticated = computed(() => !!user.value)

    // Инициализация авторизации
    const initialize = async () => {
        if (initialized.value) return

        loading.value = true
        try {
            // Получаем текущую сессию
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
                console.error('Error getting session:', error)
            } else if (session?.user) {
                user.value = session.user
                await loadProfile()
            }

            // Подписываемся на изменения авторизации
            supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.id)

                if (session?.user) {
                    user.value = session.user
                    await loadProfile()
                } else {
                    user.value = null
                    profile.value = null
                }
            })
        } catch (error) {
            console.error('Error initializing auth:', error)
        } finally {
            loading.value = false
            initialized.value = true
        }
    }

    // Безопасная авторизация через Telegram initData
    const signInWithTelegram = async (initData: string) => {
        loading.value = true
        try {
            // Отправляем initData на сервер для верификации
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ initData })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Authentication failed')
            }

            if (result.success && result.session) {
                // Устанавливаем сессию в Supabase
                const { error } = await supabase.auth.setSession({
                    access_token: result.session.access_token,
                    refresh_token: result.session.refresh_token
                })

                if (error) {
                    throw error
                }

                // Загружаем профиль
                await loadProfile()
                
                return { 
                    success: true, 
                    isNewUser: result.isNewUser,
                    user: result.user
                }
            }

            return { success: false, error: 'Unknown error' }
        } catch (error: any) {
            console.error('Error signing in with Telegram:', error)
            return { success: false, error: error.message }
        } finally {
            loading.value = false
        }
    }

    // Загрузка профиля пользователя
    const loadProfile = async () => {
        if (!user.value) return

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.value.id)
                .single()

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error loading profile:', error)
                return
            }

            profile.value = data
        } catch (error) {
            console.error('Error loading profile:', error)
        }
    }

  // Создание или обновление профиля пользователя
  const upsertProfile = async (profileData: Omit<UserProfileInsert, 'id' | 'created_at' | 'updated_at'>) => {
        if (!user.value) {
            throw new Error('User not authenticated')
        }

        loading.value = true
        try {
            const profilePayload = {
                id: user.value.id,
                ...profileData,
                updated_at: new Date().toISOString(),
            }

            const { data, error } = await supabase
                .from('user_profiles')
                .upsert(profilePayload)
                .select()
                .single()

            if (error) {
                throw error
            }

            profile.value = data
            return { success: true, data }
        } catch (error: any) {
            console.error('Error upserting profile:', error)
            return { success: false, error: error.message }
        } finally {
            loading.value = false
        }
    }

    // Выход
    const signOut = async () => {
        loading.value = true
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error

            user.value = null
            profile.value = null
        } catch (error) {
            console.error('Error signing out:', error)
        } finally {
            loading.value = false
        }
    }

    return {
        user,
        profile,
        loading,
        initialized,
        isAuthenticated,
        initialize,
        signInWithTelegram,
        loadProfile,
        upsertProfile,
        signOut
    }
})
