import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Замени эти значения на свои из Supabase dashboard
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Типы для базы данных (теперь берем из сгенерированных типов)
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
