import { createHmac } from 'crypto'

export interface TelegramInitData {
  query_id?: string
  user?: {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
    is_premium?: boolean
    photo_url?: string
  }
  auth_date: number
  hash: string
}

/**
 * Парсит initData строку из Telegram WebApp
 */
export function parseTelegramInitData(initData: string): TelegramInitData | null {
  try {
    const urlParams = new URLSearchParams(initData)
    const data: any = {}
    
    for (const [key, value] of urlParams) {
      if (key === 'user') {
        data.user = JSON.parse(value)
      } else if (key === 'auth_date') {
        data.auth_date = parseInt(value)
      } else {
        data[key] = value
      }
    }
    
    return data as TelegramInitData
  } catch (error) {
    console.error('Error parsing Telegram initData:', error)
    return null
  }
}

/**
 * Проверяет валидность Telegram initData (только на сервере с секретным ключом)
 * Эта функция должна выполняться на сервере, не на клиенте!
 */
export function verifyTelegramInitData(initData: string, botToken: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    
    if (!hash) return false
    
    // Убираем hash из параметров
    urlParams.delete('hash')
    
    // Сортируем параметры и создаем строку для проверки
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    
    // Создаем секретный ключ из токена бота
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
    
    // Создаем подпись
    const calculatedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')
    
    return calculatedHash === hash
  } catch (error) {
    console.error('Error verifying Telegram initData:', error)
    return false
  }
}

/**
 * Проверяет, что данные не старше 24 часов
 */
export function isInitDataFresh(authDate: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  const maxAge = 24 * 60 * 60 // 24 часа в секундах
  return (now - authDate) <= maxAge
}
