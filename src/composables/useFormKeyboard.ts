import { ref, onMounted, onUnmounted } from 'vue'

export const useFormKeyboard = () => {
  const isEditing = ref(false)
  const activeField = ref<string | null>(null)
  const isMobile = ref(false)
  const initialViewportHeight = ref(0)

  const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Универсальный обработчик фокуса для всех полей
  const handleFieldFocus = (fieldType: string, containerElement: HTMLElement | null) => {
    isEditing.value = true
    activeField.value = fieldType
    
    if (!containerElement) return
    
    // Сначала позиционируем поле, затем ждем появления клавиатуры
    containerElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start',
      inline: 'nearest'
    })
    
    // Ждем завершения скролла, затем корректируем позицию после появления клавиатуры
    setTimeout(() => {
      if (containerElement && isEditing.value && activeField.value === fieldType) {
        // Дополнительная корректировка позиции после появления клавиатуры
        containerElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        })
        
        // Небольшой отступ сверху для лучшей видимости заголовка
        setTimeout(() => {
          window.scrollBy({ top: -60, behavior: 'smooth' })
        }, 100)
      }
    }, 500)
  }

  // Обработчики клика по полям для принудительного фокуса
  const createFieldClickHandler = (inputRef: any) => {
    return () => {
      if (inputRef.value) {
        inputRef.value.focus()
      }
    }
  }

  const handleInputBlur = () => {
    isEditing.value = false
    activeField.value = null
  }

  // Улучшенный обработчик клика вне полей
  const createContainerClickHandler = (inputRefs: any[], fieldRefs: any[]) => {
    return (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Проверяем, не является ли клик по input, select, textarea или их контейнерам
      const isClickOnField = inputRefs.some(ref => target === ref.value) ||
        fieldRefs.some(ref => target.closest(`[ref="${ref.value?.getAttribute?.('ref') || ref.value?.$el?.getAttribute?.('ref')}"]`)) ||
        target.closest('select') ||
        target.closest('input') ||
        target.closest('textarea')
      
      if (!isClickOnField) {
        // Закрываем клавиатуру если какое-то поле в фокусе
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }
    }
  }

  // Отслеживаем появление клавиатуры и корректируем позицию
  const handleViewportChange = (getActiveContainer: () => HTMLElement | null) => {
    if (!isEditing.value || !activeField.value) return
    
    const currentHeight = window.innerHeight
    const heightDifference = initialViewportHeight.value - currentHeight
    
    // Если высота уменьшилась более чем на 150px - появилась клавиатура
    if (heightDifference > 150) {
      const containerElement = getActiveContainer()
      if (containerElement) {
        // Позиционируем поле в верхней части видимой области
        containerElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        })
        // Отступ сверху для комфортного просмотра заголовка
        setTimeout(() => {
          window.scrollBy({ top: -60, behavior: 'smooth' })
        }, 100)
      }
    }
  }

  // Универсальный обработчик Enter для закрытия клавиатуры
  const handleEnterKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      const input = event.target as HTMLInputElement
      input.blur()
      event.preventDefault()
    }
  }

  const handleNumberKeypress = (event: KeyboardEvent) => {
    const char = event.key
    const input = event.target as HTMLInputElement
    
    // Enter закрывает клавиатуру
    if (char === 'Enter') {
      input.blur()
      event.preventDefault()
      return
    }
    
    // Разрешаем: цифры, точка, запятая, минус, backspace, delete, tab, escape, стрелки
    if (
      /[0-9]/.test(char) || 
      char === '.' || 
      char === ',' || 
      char === '-' ||
      ['Backspace', 'Delete', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(char)
    ) {
      // Дополнительная проверка для точки/запятой - только одна на поле
      if ((char === '.' || char === ',') && input.value.includes('.')) {
        event.preventDefault()
      }
      return
    }
    
    // Блокируем все остальные символы
    event.preventDefault()
  }

  onMounted(() => {
    checkMobile()
    
    // Запоминаем изначальную высоту viewport
    initialViewportHeight.value = window.innerHeight
    
    // Слушаем изменения размера окна
    window.addEventListener('resize', checkMobile)
    
    // Также слушаем изменения высоты viewport (для мобильных браузеров)
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        initialViewportHeight.value = window.innerHeight
      }, 100)
    })
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })

  return {
    isEditing,
    activeField,
    isMobile,
    checkMobile,
    handleFieldFocus,
    createFieldClickHandler,
    handleInputBlur,
    createContainerClickHandler,
    handleViewportChange,
    handleEnterKey,
    handleNumberKeypress
  }
}
