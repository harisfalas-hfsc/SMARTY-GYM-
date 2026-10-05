import type { SupabaseClient } from '@supabase/supabase-js'
import { PREMIUM_WELCOME_INTRO, premiumWelcomeTitle } from './premium-welcome-content'

type DB = SupabaseClient

/** Sends the first-Premium welcome once per member. Throws so Stripe retries incomplete work. */
export async function sendFirstPremiumWelcome(input: {
  db: DB
  userId: string
}): Promise<boolean> {
  const db = input.db as any
  const { data: subscription, error: subscriptionError } = await db
    .from('subscriptions')
    .select('premium_welcome_sent_at')
    .eq('user_id', input.userId)
    .eq('provider', 'stripe')
    .maybeSingle()
  if (subscriptionError) throw new Error(subscriptionError.message)
  if (subscription?.premium_welcome_sent_at) return false

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('email,display_name')
    .eq('id', input.userId)
    .maybeSingle()
  if (profileError) throw new Error(profileError.message)
  const email = profile?.email as string | undefined
  if (!email) throw new Error('Premium welcome recipient email is missing')

  const name = (profile?.display_name as string | null | undefined)?.trim() || undefined
  const dedupeKey = `premium-welcome:${input.userId}`
  const { notifyOnce } = await import('@/lib/billing-notify.server')
  await notifyOnce(db, {
    userId: input.userId,
    kind: 'welcome',
    title: premiumWelcomeTitle(name),
    body: PREMIUM_WELCOME_INTRO,
    dedupeKey,
  })

  const { sendTemplateEmail } = await import('@/lib/email-templates/send-email')
  await sendTemplateEmail('premium-welcome', email, {
    templateData: { name },
    idempotencyKey: dedupeKey,
  })

  const { error: updateError } = await db
    .from('subscriptions')
    .update({ premium_welcome_sent_at: new Date().toISOString() })
    .eq('user_id', input.userId)
    .eq('provider', 'stripe')
    .is('premium_welcome_sent_at', null)
  if (updateError) throw new Error(updateError.message)
  return true
}