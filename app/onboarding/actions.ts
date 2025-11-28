'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserProfile } from '@/lib/storage'

export async function saveUserProfile(profile: UserProfile) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const profileData = {
    id: user.id,
    full_name: profile.name,
    phone: profile.phone,
    dob: profile.dob || null,
    gender: profile.gender,
    weight: profile.weight ? parseFloat(profile.weight) : null,
    conditions: profile.conditions,
    allergies: profile.allergies,
    doctor_name: profile.doctorName,
    emergency_contact: profile.emergencyContact,
    telegram_chat_id: profile.telegramChatId,
    preferences: profile.preferences,
    updated_at: new Date().toISOString(),
  }

  const { error, } = await supabase.from('profiles').upsert(profileData)

  if (error) {
    console.error('Error saving profile:', JSON.stringify(error, null, 2))
    throw new Error(`Failed to save profile: ${error.message} (Details: ${error.details}, Hint: ${error.hint})`)
  }

  redirect('/dashboard')
}
