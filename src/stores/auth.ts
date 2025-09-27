import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type UserProfile, type UserProfileInsert } from '@/lib/supabase'
import type { TelegramUser } from '@/composables/useTelegram'

export const useAuthStore = defineStore('auth', () => {
    const telegramUser = ref<TelegramUser | null>(null)
    const profile = ref<UserProfile | null>(null)
    const loading = ref(false)
    const isAuthenticated = computed(() => !!telegramUser.value)
    
    const hasCompleteProfile = computed(() => {
        if (profile.value && profile.value.profile_completed !== null) {
            return profile.value.profile_completed
        }

        return false
    })

    // Инициализация авторизации
    const initialize = async (user: TelegramUser) => {
        console.log('start initialize auth store', user)

        if (profile.value) {
            console.log('already initialized')
            return
        }

        await signInWithTelegram(user)

        console.log('end initialize auth store', profile.value)
    }

    // Простая авторизация через Telegram пользователя
    const signInWithTelegram = async (user: TelegramUser) => {
        loading.value = true
        try {
            telegramUser.value = user
            await loadProfile()
            
            return { 
                success: true, 
                user
            }
        } catch (error: any) {
            console.error('Error signing in with Telegram:', error)
            return { success: false, error: error.message }
        } finally {
            loading.value = false
        }
    }

    // Загрузка профиля пользователя
    const loadProfile = async () => {
        if (!telegramUser.value) return

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('telegram_id', telegramUser.value.id)
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
    const upsertProfile = async (profileData: Omit<UserProfileInsert, 'telegram_id' | 'created_at' | 'updated_at'>) => {
        if (!telegramUser.value) {
            throw new Error('User not authenticated')
        }

        loading.value = true
        try {
            const { first_name, last_name, ...otherProfileData } = profileData
            
            // Проверяем будет ли профиль завершенным после обновления
            const willBeComplete = !!(
                otherProfileData.height && 
                otherProfileData.weight && 
                otherProfileData.gender && 
                otherProfileData.birth_date
            )
            
            const profilePayload = {
                telegram_id: telegramUser.value.id,
                username: telegramUser.value.username,
                updated_at: new Date().toISOString(),
                // Используем данные из формы, если есть, иначе из Telegram
                first_name: first_name || telegramUser.value.first_name,
                last_name: last_name || telegramUser.value.last_name || '',
                profile_completed: willBeComplete,
                ...otherProfileData,
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

    return {
        telegramUser,
        profile,
        loading,
        isAuthenticated,
        hasCompleteProfile,
        initialize,
        signInWithTelegram,
        loadProfile,
        upsertProfile,
    }
})
