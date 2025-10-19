import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTelegram } from './useTelegram'

export function useTelegramBackButton() {
    const router = useRouter()
    const { showBackButton, hideBackButton, hapticFeedback } = useTelegram()

    const setupBackButton = (customHandler?: () => void) => {
        const handleBack = () => {
            hapticFeedback('impact')
            if (customHandler) {
                customHandler()
            } else {
                router.back()
            }
        }

        showBackButton(handleBack)
    }

    const removeBackButton = () => {
        hideBackButton()
    }

    onMounted(() => {
        // Back button will be set up by individual components
    })

    onUnmounted(() => {
        removeBackButton()
    })

    return {
        setupBackButton,
        removeBackButton
    }
}
