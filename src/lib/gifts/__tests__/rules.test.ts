import {describe,it,expect} from 'vitest';
import {giftEligibility,giftEnd,reminderAt,giftInput,giftPaymentSettled,GIFT_AMOUNT,GIFT_DAYS,GIFT_MESSAGES} from '../rules';
const eligible={buyerPremium:true,self:false,everPremium:false,existingGift:false};
describe('Smarty Gift business rules',()=>{
 it('costs 499 cents once',()=>expect(GIFT_AMOUNT).toBe(499));
 it('grants exactly 30 days from claim, not purchase',()=>{expect(GIFT_DAYS).toBe(30);expect(giftEnd('2026-10-23T10:00:00Z')).toBe('2026-11-22T10:00:00.000Z');});
 it('requires active Premium buyer',()=>expect(giftEligibility({...eligible,buyerPremium:false})).not.toBeNull());
 it('rejects self-gifting',()=>expect(giftEligibility({...eligible,self:true})).not.toBeNull());
 it('rejects current or former Premium recipients',()=>expect(giftEligibility({...eligible,everPremium:true})).not.toBeNull());
 it('allows never-Premium visitor or free account',()=>expect(giftEligibility(eligible)).toBeNull());
 it('rejects duplicate recipient gifts forever',()=>expect(giftEligibility({...eligible,existingGift:true})).not.toBeNull());
 it('first reminder is three days after purchase',()=>expect(reminderAt('2026-10-23T10:00:00Z',0)).toBe('2026-10-26T10:00:00.000Z'));
 it('next reminders are seven days apart without expiry',()=>{expect(reminderAt('2026-10-23T10:00:00Z',1)).toBe('2026-11-02T10:00:00.000Z');expect(reminderAt('2026-10-23T10:00:00Z',2)).toBe('2026-11-09T10:00:00.000Z');expect(new Date(reminderAt('2026-10-23T10:00:00Z',100)).getTime()).toBeGreaterThan(Date.parse('2028-01-01'));});
 it('waits for settled payments',()=>{expect(giftPaymentSettled('unpaid')).toBe(false);expect(giftPaymentSettled('paid')).toBe(true);expect(giftPaymentSettled('no_payment_required')).toBe(true);});
 it('offers ten preset choices',()=>expect(GIFT_MESSAGES).toHaveLength(10));
 it('allows custom messages at 300 characters, not 301',()=>{const input={recipientEmail:' TEST@example.com ',recipientName:'Test',senderName:'Maria',environment:'sandbox',returnUrl:'http://localhost:8080/smarty-gift/return',actionId:'00000000-0000-4000-8000-000000000001',message:'x'.repeat(300)};expect(giftInput.parse(input).recipientEmail).toBe('test@example.com');expect(giftInput.safeParse({...input,message:'x'.repeat(301)}).success).toBe(false);});
});
