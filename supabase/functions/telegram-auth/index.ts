import { serve } from "@std/http"
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

interface TelegramInitData {
  user: TelegramUser
  auth_date: number
  hash: string
}

async function verifyTelegramInitData(initData: string, botToken: string): Promise<boolean> {
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
    const secretKeyData = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('WebAppData'))
    const secretKey = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.digest('SHA-256', new Uint8Array([...new Uint8Array(secretKeyData), ...new TextEncoder().encode(botToken)])),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    // Создаем подпись
    const signature = await crypto.subtle.sign('HMAC', secretKey, new TextEncoder().encode(dataCheckString))
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return calculatedHash === hash
  } catch (error) {
    console.error('Error verifying Telegram initData:', error)
    return false
  }
}

function parseTelegramInitData(initData: string): TelegramInitData | null {
  try {
    const urlParams = new URLSearchParams(initData)
    const userStr = urlParams.get('user')
    const authDateStr = urlParams.get('auth_date')
    const hash = urlParams.get('hash')
    
    if (!userStr || !authDateStr || !hash) return null
    
    return {
      user: JSON.parse(userStr),
      auth_date: parseInt(authDateStr),
      hash
    }
  } catch (error) {
    console.error('Error parsing Telegram initData:', error)
    return null
  }
}

function isInitDataFresh(authDate: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  const maxAge = 24 * 60 * 60 // 24 часа
  return (now - authDate) <= maxAge
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { initData } = await req.json()
    
    if (!initData) {
      return new Response(
        JSON.stringify({ error: 'initData is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Получаем токен бота из переменных окружения
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: 'Bot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Проверяем подпись Telegram
    if (!(await verifyTelegramInitData(initData, botToken))) {
      return new Response(
        JSON.stringify({ error: 'Invalid Telegram data' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Парсим данные
    const telegramData = parseTelegramInitData(initData)
    if (!telegramData) {
      return new Response(
        JSON.stringify({ error: 'Failed to parse Telegram data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Проверяем свежесть данных
    if (!isInitDataFresh(telegramData.auth_date)) {
      return new Response(
        JSON.stringify({ error: 'Telegram data is too old' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Создаем Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Ищем существующего пользователя по telegram_id
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('telegram_id', telegramData.user.id)
      .single()

    let userId: string

    if (existingProfile) {
      // Пользователь существует
      userId = existingProfile.id
      
      // Обновляем данные профиля (имя могло измениться)
      await supabase
        .from('user_profiles')
        .update({
          first_name: telegramData.user.first_name,
          last_name: telegramData.user.last_name || '',
          username: telegramData.user.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        
    } else {
      // Создаем нового пользователя
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: `telegram_${telegramData.user.id}@telegram.local`, // Фиктивный email
        email_confirm: true,
        user_metadata: {
          telegram_id: telegramData.user.id,
          first_name: telegramData.user.first_name,
          last_name: telegramData.user.last_name,
          username: telegramData.user.username
        }
      })

      if (createError || !newUser.user) {
        throw createError || new Error('Failed to create user')
      }

      userId = newUser.user.id

      // Создаем базовый профиль (пользователь заполнит остальные данные позже)
      await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          telegram_id: telegramData.user.id,
          first_name: telegramData.user.first_name,
          last_name: telegramData.user.last_name || '',
          username: telegramData.user.username,
          profile_completed: false
        })
    }

    // Создаем JWT токен для пользователя
    const { data: { session }, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `telegram_${telegramData.user.id}@telegram.local`,
      options: {
        redirectTo: `${req.headers.get('origin') || 'http://localhost:5173'}`
      }
    })

    if (sessionError || !session) {
      throw sessionError || new Error('Failed to create session')
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: session,
        user: telegramData.user,
        isNewUser: !existingProfile
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Telegram auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
