import { ref, onMounted, onUnmounted } from 'vue'
import WebApp from '@twa-dev/sdk'

// Extend Window interface to include Telegram WebApp
declare global {
    interface Window {
        Telegram?: {
            WebApp?: {
                showAlert: (message: string) => void
                HapticFeedback?: {
                    impactOccurred: (style: string) => void
                    notificationOccurred: (type: string) => void
                    selectionChanged: () => void
                }
            }
        }
    }
}

export interface TelegramUser {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
    is_premium?: boolean
    photo_url?: string
}

export interface TelegramWebApp {
    initData: string
    initDataUnsafe: {
        user?: TelegramUser
        chat_instance?: string
        chat_type?: string
        start_param?: string
        auth_date?: number
        hash?: string
    }
    version: string
    platform: string
    colorScheme: 'light' | 'dark'
    themeParams: {
        bg_color?: string
        text_color?: string
        hint_color?: string
        link_color?: string
        button_color?: string
        button_text_color?: string
        secondary_bg_color?: string
    }
    isExpanded: boolean
    viewportHeight: number
    viewportStableHeight: number
    headerColor: string
    backgroundColor: string
}

export function useTelegram() {
    const isReady = ref(false)
    const user = ref<TelegramUser | null>(null)
    const webApp = ref<TelegramWebApp | null>(null)

    const initTelegram = () => {
        try {
            // Check for mock mode (for testing)
            const urlParams = new URLSearchParams(window.location.search)
            const isMock = urlParams.get('mock') === 'true'

            if (isMock) {
                // Mock mode for testing
                const mockUser = urlParams.get('user')
                const mockTheme = urlParams.get('theme') || 'light'

                const mockUsers: { [key: string]: TelegramUser } = {
                    test: {
                        id: 123456789,
                        first_name: "Тест",
                        last_name: "Пользователь",
                        username: "testuser",
                        language_code: "ru"
                    },
                    premium: {
                        id: 987654321,
                        first_name: "Premium",
                        last_name: "User",
                        username: "premiumuser",
                        language_code: "ru",
                        is_premium: true
                    }
                }

                const mockThemes: { [key: string]: any } = {
                    light: {
                        bg_color: "#ffffff",
                        text_color: "#000000",
                        hint_color: "#999999",
                        link_color: "#2481cc",
                        button_color: "#2481cc",
                        button_text_color: "#ffffff",
                        secondary_bg_color: "#f1f1f1"
                    },
                    dark: {
                        bg_color: "#212121",
                        text_color: "#ffffff",
                        hint_color: "#aaaaaa",
                        link_color: "#6ab7ff",
                        button_color: "#6ab7ff",
                        button_text_color: "#000000",
                        secondary_bg_color: "#181818"
                    }
                }

                user.value = mockUser && mockUser !== 'none' ? mockUsers[mockUser] || null : null
                webApp.value = {
                    version: '6.0',
                    platform: 'web',
                    colorScheme: mockTheme as 'light' | 'dark',
                    themeParams: mockThemes[mockTheme],
                    isExpanded: true,
                    viewportHeight: 600,
                    viewportStableHeight: 600,
                    headerColor: mockThemes[mockTheme].bg_color,
                    backgroundColor: mockThemes[mockTheme].bg_color,
                    initData: '',
                    initDataUnsafe: { user: user.value }
                } as any

                isReady.value = true
                console.log('Mock Telegram WebApp initialized:', { user: user.value, theme: mockTheme })
                return
            }

            if (typeof window !== 'undefined' && WebApp) {
                WebApp.ready()

                webApp.value = WebApp as any
                user.value = WebApp.initDataUnsafe?.user || null
                isReady.value = true

                // Expand the app to full height
                WebApp.expand()

                // Enable closing confirmation
                WebApp.enableClosingConfirmation()

                // Set header color to match theme
                if (WebApp.themeParams.bg_color) {
                    WebApp.setHeaderColor(WebApp.themeParams.bg_color)
                }

                console.log('Telegram WebApp initialized:', {
                    version: WebApp.version,
                    platform: WebApp.platform,
                    user: user.value
                })
            } else {
                // Fallback for browser testing
                console.log('Telegram WebApp not available - running in browser mode')
                isReady.value = true
            }
        } catch (error) {
            console.error('Failed to initialize Telegram WebApp:', error)
            isReady.value = true // Still show the app
        }
    }

    const showAlert = (message: string) => {
        try {
            if (typeof window !== 'undefined' && window.Telegram?.WebApp?.showAlert) {
                window.Telegram.WebApp.showAlert(message)
            } else {
                alert(message)
            }
        } catch (error) {
            console.warn('Show alert error:', error)
            alert(message)
        }
    }

    const showConfirm = (message: string, callback?: (confirmed: boolean) => void) => {
        if (webApp.value) {
            WebApp.showConfirm(message, callback)
        } else {
            const result = confirm(message)
            callback?.(result)
        }
    }

    const hapticFeedback = (type: 'impact' | 'notification' | 'selection' | 'error' | 'success' = 'impact') => {
        try {
            if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
                const haptic = window.Telegram.WebApp.HapticFeedback
                switch (type) {
                    case 'impact':
                        haptic.impactOccurred('medium')
                        break
                    case 'notification':
                    case 'success':
                        haptic.notificationOccurred('success')
                        break
                    case 'error':
                        haptic.notificationOccurred('error')
                        break
                    case 'selection':
                        haptic.selectionChanged()
                        break
                }
            } else {
                console.log(`Haptic feedback: ${type}`)
            }
        } catch (error) {
            console.warn('Haptic feedback error:', error)
        }
    }

    const close = () => {
        if (webApp.value) {
            WebApp.close()
        }
    }

    const sendData = (data: string) => {
        if (webApp.value) {
            WebApp.sendData(data)
        }
    }

    onMounted(() => {
        initTelegram()
    })

    onUnmounted(() => {
        // Cleanup if needed
    })

    return {
        isReady,
        user,
        webApp,
        showAlert,
        showConfirm,
        hapticFeedback,
        close,
        sendData
    }
}
