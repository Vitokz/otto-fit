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
                BackButton?: {
                    show: () => void
                    hide: () => void
                    onClick: (callback: () => void) => void
                    offClick: (callback: () => void) => void
                    isVisible: boolean
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
    safeAreaInset?: { top: number; right: number; bottom: number; left: number }
    contentSafeAreaInset?: { top: number; right: number; bottom: number; left: number }
}

export function useTelegram() {
    const isReady = ref(false)
    const user = ref<TelegramUser | null>(null)
    const webApp = ref<TelegramWebApp | null>(null)
    let viewportHandler: ((params: { isStateStable: boolean }) => void) | null = null
    let resizeHandler: (() => void) | null = null

    const setViewportCssVars = () => {
        try {
            if (!webApp.value) return
            const root = document.documentElement
            const currentHeight = (webApp.value as any).viewportHeight || 0
            const stableHeight = (webApp.value as any).viewportStableHeight || currentHeight
            if (currentHeight) root.style.setProperty('--tg-viewport-height', `${currentHeight}px`)
            if (stableHeight) root.style.setProperty('--tg-viewport-stable-height', `${stableHeight}px`)
        } catch (_) {
            // noop
        }
    }

    const setSafeAreaCssVars = () => {
        try {
            if (!webApp.value) return
            const root = document.documentElement
            const sa = (webApp.value as any).safeAreaInset
            const csa = (webApp.value as any).contentSafeAreaInset
            if (sa) {
                if (typeof sa.top === 'number') root.style.setProperty('--tg-safe-area-inset-top', `${sa.top}px`)
                if (typeof sa.right === 'number') root.style.setProperty('--tg-safe-area-inset-right', `${sa.right}px`)
                if (typeof sa.bottom === 'number') root.style.setProperty('--tg-safe-area-inset-bottom', `${sa.bottom}px`)
                if (typeof sa.left === 'number') root.style.setProperty('--tg-safe-area-inset-left', `${sa.left}px`)
            }
            if (csa) {
                if (typeof csa.top === 'number') root.style.setProperty('--tg-content-safe-area-inset-top', `${csa.top}px`)
                if (typeof csa.right === 'number') root.style.setProperty('--tg-content-safe-area-inset-right', `${csa.right}px`)
                if (typeof csa.bottom === 'number') root.style.setProperty('--tg-content-safe-area-inset-bottom', `${csa.bottom}px`)
                if (typeof csa.left === 'number') root.style.setProperty('--tg-content-safe-area-inset-left', `${csa.left}px`)
            }
        } catch (_) {
            // noop
        }
    }

    const initTelegram = () => {
        try {
            const isMock = import.meta.env.DEV

            if (isMock) {
                const mockUser = 'test'
                const mockTheme = 'light'

                const mockUsers: { [key: string]: TelegramUser } = {
                    test: {
                        id: 123456789,
                        first_name: "Тест",
                        last_name: "Пользователь",
                        username: "testuser",
                        language_code: "ru"
                    },
                }

                user.value = mockUsers[mockUser]
                webApp.value = {
                    version: '6.0',
                    platform: 'web',
                    colorScheme: mockTheme as 'light' | 'dark',
                    isExpanded: true,
                    viewportHeight: 600,
                    viewportStableHeight: 600,
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

                // Initial expand and CSS vars
                try { WebApp.expand() } catch (_) {}
                try { WebApp.enableClosingConfirmation() } catch (_) {}
                setViewportCssVars()
                setSafeAreaCssVars()

                WebApp.requestFullscreen()

                // Try to reduce collapses from gestures if supported
                try { (WebApp as any).disableVerticalSwipes?.() } catch (_) {}

                // Keep expanding when viewport changes (inline/attach menu launches)
                viewportHandler = ({ isStateStable }: { isStateStable: boolean }) => {
                    try { WebApp.expand() } catch (_) {}
                    setViewportCssVars()
                    setSafeAreaCssVars()
                    if (isStateStable) {
                        setViewportCssVars()
                        setSafeAreaCssVars()
                    }
                }
                ;(WebApp as any).onEvent?.('viewportChanged', viewportHandler)

                // Fallback: update on window resize as well
                resizeHandler = () => {
                    try { WebApp.expand() } catch (_) {}
                    setViewportCssVars()
                    setSafeAreaCssVars()
                }
                window.addEventListener('resize', resizeHandler, { passive: true })

                // Set header color to match theme
                if (WebApp.themeParams.bg_color) {
                    WebApp.setHeaderColor(WebApp.themeParams.bg_color)
                }

                console.log('Telegram WebApp initialized:', {
                    version: WebApp.version,
                    platform: WebApp.platform,
                    user: user.value
                })
            }
        } catch (error) {
            console.error('Error initializing Telegram:', error)
            isReady.value = false
            user.value = null
            webApp.value = null
            showAlert('Ошибка инициализации Telegram')
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

    const showBackButton = (callback: () => void) => {
        try {
            if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
                window.Telegram.WebApp.BackButton.show()
                window.Telegram.WebApp.BackButton.onClick(callback)
            }
        } catch (error) {
            console.warn('Show back button error:', error)
        }
    }

    const hideBackButton = () => {
        try {
            if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
                window.Telegram.WebApp.BackButton.hide()
            }
        } catch (error) {
            console.warn('Hide back button error:', error)
        }
    }

    const isBackButtonVisible = () => {
        try {
            if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
                return window.Telegram.WebApp.BackButton.isVisible
            }
            return false
        } catch (error) {
            console.warn('Check back button visibility error:', error)
            return false
        }
    }

    onMounted(() => {
        initTelegram()
    })

    onUnmounted(() => {
        try {
            if ((WebApp as any).offEvent && viewportHandler) {
                ;(WebApp as any).offEvent('viewportChanged', viewportHandler)
            }
        } catch (_) {}
        try {
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler)
            }
        } catch (_) {}
    })

    return {
        isReady,
        user,
        webApp,
        showAlert,
        showConfirm,
        hapticFeedback,
        close,
        sendData,
        showBackButton,
        hideBackButton,
        isBackButtonVisible
    }
}
