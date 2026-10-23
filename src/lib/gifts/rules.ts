import { z } from 'zod';
export const GIFT_PRICE_ID = 'smarty_gift_one_month';
export const GIFT_AMOUNT = 499;
export const GIFT_DAYS = 30;
export const GIFT_MESSAGES = [
 { label: 'Train together', message: 'I want us to train together.' },
 { label: 'Birthday', message: 'Happy Birthday! Here is to a stronger, healthier year ahead.' },
 { label: 'Name day', message: 'Happy Name Day! Wishing you health, strength, and happiness.' },
 { label: 'Christmas', message: 'Merry Christmas! The gift of health and energy for the holidays.' },
 { label: 'New Year', message: 'Happy New Year! Let’s make this your fittest year yet.' },
 { label: 'Halloween', message: 'Happy Halloween! No tricks, just real strength and workouts.' },
 { label: 'Valentine’s', message: 'Happy Valentine’s Day! Investing in your health because I care about you.' },
 { label: 'Health', message: 'A gift for your health. The best investment you can ever make in yourself.' },
 { label: 'Encouragement', message: 'Proud of you! Time to take your training to the next level.' },
 { label: 'Thank you', message: 'Thank you for everything. Take care of your body and mind.' },
] as const;
export const DEFAULT_GIFT_INTRO = 'Someone who cares about you has given you 30 days of SMARTYGYM Premium. Your gift never expires before activation. Claim it whenever you are ready — your 30 days begin when you activate it.';
export const giftInput = z.object({ recipientEmail: z.string().trim().email().max(254).transform(s => s.toLowerCase()), recipientName: z.string().trim().min(1).max(100), senderName: z.string().trim().min(1).max(100), message: z.string().trim().min(1).max(300), environment: z.enum(['sandbox','live']), returnUrl: z.string().url().max(1000), actionId: z.string().uuid() });
export const tokenInput = z.object({ token: z.string().uuid() });
export function giftPaymentSettled(status: string) { return status === 'paid' || status === 'no_payment_required'; }
export function reminderAt(paidAt: string, reminderNumber: number) { return new Date(new Date(paidAt).getTime() + (3 + reminderNumber * 7) * 86400000).toISOString(); }
export function giftEnd(claimedAt: string) { return new Date(new Date(claimedAt).getTime() + GIFT_DAYS * 86400000).toISOString(); }
export function giftEligibility(input: { buyerPremium: boolean; self: boolean; everPremium: boolean; existingGift: boolean }) {
 if (!input.buyerPremium) return 'Only active Premium members can buy Smarty Gift.';
 if (input.self) return 'You cannot send Smarty Gift to yourself.';
 if (input.everPremium) return 'Smarty Gift is only for someone who has never held Premium.';
 if (input.existingGift) return 'This recipient already has a gift or a payment in progress.';
 return null;
}
