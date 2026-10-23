import {createServerFn} from '@tanstack/react-start';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {z} from 'zod';
import {giftInput,tokenInput,GIFT_PRICE_ID,GIFT_AMOUNT} from './rules';
import {createStripeClient,getStripeErrorMessage} from '../stripe.server';
import type {GiftRow} from './service.server';
export const checkGiftRecipient=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({email:z.string().trim().email().max(254).transform(s=>s.toLowerCase())})).handler(async({data,context})=>{
 try{const {data:auth}=await context.supabase.auth.getUser();if(!auth.user?.email)throw new Error('Sign in to check gift eligibility.');const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {recipientEligibility}=await import('./service.server');const reason=await recipientEligibility(supabaseAdmin,context.userId,auth.user.email,data.email);return {eligible:!reason,reason};}catch(e){return {eligible:false,reason:e instanceof Error?e.message:'Could not check eligibility.'};}
});
async function resolveOrCreateCustomer(stripe:ReturnType<typeof createStripeClient>,options:{email?:string;userId?:string}):Promise<string>{
 if(options.userId&&!/^[a-zA-Z0-9_-]+$/.test(options.userId))throw new Error('Invalid userId');
 if(options.userId){const found=await stripe.customers.search({query:`metadata['userId']:'${options.userId}'`,limit:1});if(found.data.length&&found.data[0])return found.data[0].id;}
 if(options.email){const existing=await stripe.customers.list({email:options.email,limit:1});const customer=existing.data[0];if(customer){if(options.userId&&customer.metadata?.userId!==options.userId)await stripe.customers.update(customer.id,{metadata:{...customer.metadata,userId:options.userId}});return customer.id;}}
 const created=await stripe.customers.create({...options.email&&{email:options.email},...options.userId&&{metadata:{userId:options.userId}}});return created.id;
}
export const createGiftCheckout=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(giftInput).handler(async({data,context}):Promise<{clientSecret:string;giftId:string}|{error:string}>=>{
 try{
  const {isFreeAccessMode}=await import('../free-access.server');if(await isFreeAccessMode())throw new Error('No purchase is required while free access is enabled.');
  const origin=new URL(data.returnUrl).origin;if(!['https://smartygym.com','https://www.smartygym.com','https://thesmartygym.lovable.app','http://localhost:8080'].includes(origin)&&!/^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin))throw new Error('Invalid return address.');
  const {data:{user}}=await context.supabase.auth.getUser();if(!user?.email)throw new Error('Sign in before purchasing a gift.');
  const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const db=supabaseAdmin;
  const stripe=createStripeClient(data.environment);
  const {data:previous,error:previousError}=await db.from('smarty_gifts').select('*').eq('buyer_id',context.userId).eq('recipient_email',data.recipientEmail).eq('environment',data.environment).neq('status','released').maybeSingle();if(previousError)throw new Error(previousError.message);
  if(previous?.status==='pending'&&previous.checkout_session_id){const session=await stripe.checkout.sessions.retrieve(previous.checkout_session_id);if(session.status==='open'&&session.client_secret)return {clientSecret:session.client_secret,giftId:previous.id};if(session.status==='expired'){await db.from('smarty_gifts').update({status:'released'}).eq('id',previous.id).eq('status','pending');}else throw new Error('Your gift payment is being confirmed.');}
  const {data:reserved,error}=await db.rpc('reserve_smarty_gift',{p_buyer:context.userId,p_buyer_email:user.email,p_sender:data.senderName,p_name:data.recipientName,p_email:data.recipientEmail,p_message:data.message,p_env:data.environment});if(error)throw new Error(error.message);const gift=reserved as unknown as GiftRow;
  try{
   const prices=await stripe.prices.list({lookup_keys:[GIFT_PRICE_ID],active:true});const price=prices.data[0];if(!price||price.unit_amount!==GIFT_AMOUNT||price.currency!=='eur'||price.type!=='one_time')throw new Error('Smarty Gift price is not configured.');
   const customer=await resolveOrCreateCustomer(stripe,{email:user.email,userId:context.userId});
   const session=await stripe.checkout.sessions.create({customer,line_items:[{price:price.id,quantity:1}],mode:'payment',ui_mode:'embedded_page',return_url:data.returnUrl,payment_intent_data:{description:'SMARTYGYM — Smarty Gift (1 Month Premium)'},metadata:{kind:'smarty_gift',giftId:gift.id,userId:context.userId},expires_at:Math.floor(Date.now()/1000)+1800},{idempotencyKey:`smarty-gift:${gift.id}`});
   const {error:saveError}=await db.from('smarty_gifts').update({checkout_session_id:session.id}).eq('id',gift.id);if(saveError)throw new Error(saveError.message);if(!session.client_secret)throw new Error('Gift checkout could not be started.');return {clientSecret:session.client_secret,giftId:gift.id};
  }catch(e){ // Release only orders for which Stripe never created a session.
   const {data:row}=await db.from('smarty_gifts').select('checkout_session_id').eq('id',gift.id).single();if(!row?.checkout_session_id)await db.from('smarty_gifts').update({status:'released'}).eq('id',gift.id).eq('status','pending');throw e;
  }
 }catch(e){return {error:getStripeErrorMessage(e)};}
});
export const getGiftClaim=createServerFn({method:'POST'}).inputValidator(tokenInput).handler(async({data}):Promise<{senderName:string;recipientName:string;message:string;status:string;endsAt:string|null}|{error:string}>=>{
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {data:gift,error}=await supabaseAdmin.from('smarty_gifts').select('sender_name,recipient_name,personal_message,status,premium_ends_at').eq('claim_token',data.token).in('status',['paid','claimed']).maybeSingle();if(error||!gift)return {error:'This gift link is unavailable or its payment is still being confirmed.'};return {senderName:gift.sender_name,recipientName:gift.recipient_name,message:gift.personal_message,status:gift.status,endsAt:gift.premium_ends_at};
});
export const claimGift=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(tokenInput).handler(async({data,context}):Promise<{ok:true;endsAt:string}|{error:string}>=>{
 try{const {data:{user}}=await context.supabase.auth.getUser();if(!user?.email||!user.email_confirmed_at)throw new Error('Confirm your email, then sign in to activate your gift.');const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {data:gift,error}=await supabaseAdmin.rpc('claim_smarty_gift',{p_token:data.token,p_user:context.userId,p_email:user.email});if(error)throw new Error(error.message);const row=gift as unknown as GiftRow;const {giftWelcome}=await import('./service.server');await giftWelcome(supabaseAdmin,row);return {ok:true,endsAt:row.premium_ends_at??''};}catch(e){return {error:e instanceof Error?e.message:'Could not activate your gift.'};}
});
export const stopGiftReminders=createServerFn({method:'POST'}).inputValidator(tokenInput).handler(async({data})=>{
 const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {error}=await supabaseAdmin.from('smarty_gifts').update({reminders_stopped:true,next_reminder_at:null}).eq('claim_token',data.token).eq('status','paid');return error?{error:error.message}:{ok:true};
});
export const confirmGiftPayment=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({sessionId:z.string().regex(/^cs_[a-zA-Z0-9_]+$/).max(255),environment:z.enum(['sandbox','live'])})).handler(async({data,context})=>{
 try{const stripe=createStripeClient(data.environment);const session=await stripe.checkout.sessions.retrieve(data.sessionId);if(session.metadata?.userId!==context.userId||session.metadata.kind!=='smarty_gift')throw new Error('This gift purchase belongs to a different account.');const {supabaseAdmin}=await import('@/integrations/supabase/client.server');const {fulfillGift}=await import('./service.server');await fulfillGift(supabaseAdmin,session,data.environment);return {paid:session.payment_status==='paid'||session.payment_status==='no_payment_required'};}catch(e){return {error:getStripeErrorMessage(e)};}
});
