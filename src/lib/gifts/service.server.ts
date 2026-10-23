import type { SupabaseClient } from '@supabase/supabase-js';
import { giftEligibility, reminderAt, DEFAULT_GIFT_INTRO } from './rules';
import { notifyOnce } from '../billing-notify.server';
export type GiftRow = { id:string; buyer_id:string; buyer_email:string; sender_name:string; recipient_name:string; recipient_email:string; personal_message:string; environment:'sandbox'|'live'; status:string; claim_token:string; checkout_session_id:string|null; payment_intent_id:string|null; paid_at:string|null; claimed_at:string|null; recipient_id:string|null; premium_ends_at:string|null; reminder_number:number; reminder_email_sent_number:number|null; next_reminder_at:string|null; reminders_stopped:boolean; recipient_delivered_at:string|null; buyer_delivered_at:string|null; welcome_sent_at:string|null };
export async function recipientEligibility(db: SupabaseClient, buyerId:string, buyerEmail:string, email:string) {
 const [{data:subs,error:sErr},{data:gift,error:gErr},{data:recipient,error:pErr},{data:history,error:hErr},{data:received,error:rErr}] = await Promise.all([
  db.from('subscriptions').select('id').eq('user_id',buyerId).in('status',['active','trialing']).or(`current_period_end.is.null,current_period_end.gt.${new Date().toISOString()}`).limit(1),
  db.from('smarty_gifts').select('id').eq('recipient_email',email).neq('status','released').limit(1),
  db.from('profiles').select('id').eq('email',email).limit(1).maybeSingle(),
  db.from('premium_email_history').select('email').eq('email',email).maybeSingle(),
  db.from('smarty_gifts').select('id').eq('recipient_id',buyerId).eq('status','claimed').gt('premium_ends_at',new Date().toISOString()).limit(1),
 ]);
 for(const e of [sErr,gErr,pErr,hErr,rErr]) if(e) throw new Error(e.message);
 let everPremium=Boolean(history);
 if(recipient) { const {count,error}=await db.from('subscriptions').select('id',{count:'exact',head:true}).eq('user_id',recipient.id); if(error) throw new Error(error.message); everPremium ||= Boolean(count); }
 return giftEligibility({buyerPremium:Boolean(subs?.length||received?.length),self:buyerEmail.toLowerCase()===email,everPremium,existingGift:Boolean(gift?.length)});
}
async function inbox(db:SupabaseClient,userId:string,title:string,body:string,key:string,path:string) {
 const inserted=await notifyOnce(db,{userId,kind:'smarty_gift',title,body,dedupeKey:key});
 if(inserted) { const {sendPushToUsers}=await import('../push-notify.server'); await sendPushToUsers(db,[userId],{title,body,path,tag:key}); }
}
export async function deliverGift(db:SupabaseClient,gift:GiftRow) {
 const {sendTemplateEmail}=await import('../email-templates/send-email');
 const claimUrl=`https://smartygym.com/claim-gift?token=${gift.claim_token}`;
 if(!gift.recipient_delivered_at && gift.status==='paid') {
  const {data:profile,error}=await db.from('profiles').select('id').eq('email',gift.recipient_email).limit(1).maybeSingle(); if(error) throw new Error(error.message);
  if(profile) await inbox(db,profile.id,`${gift.sender_name} sent you a Smarty Gift`,`${gift.personal_message}\n\n30 days of Premium, starting whenever you activate your gift.`, `smarty-gift:${gift.claim_token}:invitation`, `/claim-gift?token=${gift.claim_token}`);
  const {getCronConfig}=await import('../cron/jobs.server');const invitationConfig=await getCronConfig(db,'smarty-gift-reminders');
  const result=await sendTemplateEmail('smarty-gift',gift.recipient_email,{templateData:{senderName:gift.sender_name,recipientName:gift.recipient_name,message:gift.personal_message,claimUrl,intro:invitationConfig.content.lines?.join('\n')||DEFAULT_GIFT_INTRO},idempotencyKey:`gift:${gift.id}:invitation`});
  const {error:updateError}=await db.from('smarty_gifts').update({recipient_delivered_at:new Date().toISOString(),...(result.sent?{}:{reminders_stopped:true})}).eq('id',gift.id); if(updateError) throw new Error(updateError.message);
 }
 if(!gift.buyer_delivered_at) {
  await inbox(db,gift.buyer_id,'Your Smarty Gift is on its way',`Your gift for ${gift.recipient_name} has been purchased for €4.99.`, `smarty-gift:${gift.claim_token}:buyer`, '/smarty-gift');
  await sendTemplateEmail('smarty-gift',gift.buyer_email,{templateData:{senderName:gift.sender_name,recipientName:gift.recipient_name,message:gift.personal_message,buyer:true,claimUrl:'https://smartygym.com/smarty-gift'},idempotencyKey:`gift:${gift.id}:buyer`});
  const {error}=await db.from('smarty_gifts').update({buyer_delivered_at:new Date().toISOString()}).eq('id',gift.id); if(error) throw new Error(error.message);
 }
}
export async function fulfillGift(db:SupabaseClient,session:any,environment:'sandbox'|'live') {
 if(session.metadata?.kind!=='smarty_gift') return;
 if(session.payment_status!=='paid' && session.payment_status!=='no_payment_required') return;
 const {data:gift,error}=await db.from('smarty_gifts').select('*').eq('id',session.metadata.giftId).eq('buyer_id',session.metadata.userId).eq('environment',environment).maybeSingle(); if(error) throw new Error(error.message);
 if(!gift || (gift.checkout_session_id && gift.checkout_session_id!==session.id)) throw new Error('Gift payment does not match its order.');
 if(session.mode!=='payment' || session.currency!=='eur' || session.amount_total!==499) throw new Error('Unexpected Smarty Gift payment amount.');
 if(gift.status==='released'||gift.status==='refunded') return;
 if(gift.status==='pending') {
  const paidAt=new Date().toISOString();
  const {error:saveError}=await db.from('smarty_gifts').update({status:'paid',paid_at:paidAt,next_reminder_at:reminderAt(paidAt,0),checkout_session_id:session.id,payment_intent_id:typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id,updated_at:paidAt}).eq('id',gift.id).eq('status','pending'); if(saveError) throw new Error(saveError.message);
 }
 const {data:ready,error:readyError}=await db.from('smarty_gifts').select('*').eq('id',gift.id).single(); if(readyError) throw new Error(readyError.message);
 await deliverGift(db,ready as GiftRow);
}
export async function giftWelcome(db:SupabaseClient,gift:GiftRow) {
 if(gift.welcome_sent_at || !gift.recipient_id) return;
 const {getCronConfig,recordRun}=await import('../cron/jobs.server');
 const config=await getCronConfig(db,'premium-welcome'); if(!config.enabled) return;
 const {PREMIUM_WELCOME_INTRO,premiumWelcomeTitle}=await import('../premium-welcome-content');
 await notifyOnce(db,{userId:gift.recipient_id,kind:'welcome',title:premiumWelcomeTitle(gift.recipient_name),body:PREMIUM_WELCOME_INTRO,dedupeKey:`premium-welcome:${gift.recipient_id}`}).then(async inserted=>{ if(inserted){const {sendPushToUsers}=await import('../push-notify.server');await sendPushToUsers(db,[gift.recipient_id as string],{title:premiumWelcomeTitle(gift.recipient_name),body:PREMIUM_WELCOME_INTRO,path:'/',tag:`premium-welcome:${gift.recipient_id}`});}});
 const {sendTemplateEmail}=await import('../email-templates/send-email');
 await sendTemplateEmail('premium-welcome',gift.recipient_email,{templateData:{name:gift.recipient_name},idempotencyKey:`premium-welcome:${gift.recipient_id}`});
 const {error}=await db.from('smarty_gifts').update({welcome_sent_at:new Date().toISOString()}).eq('id',gift.id); if(error) throw new Error(error.message);
 await recordRun(db,{jobKey:'premium-welcome',status:'ok',changed:true,summary:'First Premium welcome sent after Smarty Gift activation.'});
}
// Repeated unclaimed-gift invitations use Resend, not the managed app-email
// service: these scheduled re-engagement sends must respect reminder opt-out.
export async function runGiftReminders(db:SupabaseClient,config:import('../cron/jobs.server').CronJobConfig) {
 if(!config.enabled) return {status:'skipped' as const,summary:'Smarty Gift reminders are switched off.',changed:false};
 const {data:rows,error}=await db.from('smarty_gifts').select('*').eq('status','paid').eq('reminders_stopped',false).lte('next_reminder_at',new Date().toISOString()).order('next_reminder_at').limit(25); if(error) throw new Error(error.message);
 let sent=0,stopped=0;const failures:string[]=[];
 for(const gift of (rows??[]) as GiftRow[]) {
  try {
   const now=new Date().toISOString();const {data:leased,error:leaseError}=await db.from('smarty_gifts').update({reminder_lease_until:new Date(Date.now()+300000).toISOString()}).eq('id',gift.id).eq('status','paid').eq('reminders_stopped',false).or(`reminder_lease_until.is.null,reminder_lease_until.lt.${now}`).select('id').maybeSingle();if(leaseError)throw new Error(leaseError.message);if(!leased)continue;
   const {data:current,error:checkError}=await db.from('smarty_gifts').select('status,reminders_stopped,reminder_number').eq('id',gift.id).single();if(checkError) throw new Error(checkError.message);if(current.status!=='paid'||current.reminders_stopped||current.reminder_number!==gift.reminder_number) continue;
   // Respect global managed sender suppression as well as gift reminder opt-out.
   const {getEmailUnsubscribe}=await import('@lovable.dev/email-js');
   const apiKeyForSuppression=process.env['LOVABLE_API_KEY'];if(!apiKeyForSuppression)throw new Error('Gift reminder email service is not configured.');
   const preference=await getEmailUnsubscribe({recipient:gift.recipient_email,domain:'notify.smartygym.com'},{apiKey:apiKeyForSuppression});if(!preference.subscribed){await db.from('smarty_gifts').update({reminders_stopped:true}).eq('id',gift.id);stopped++;continue;}
   const {render}=await import('@react-email/render');const React=await import('react');const {SmartyGiftEmail}=await import('../email-templates/smarty-gift');
   const claimUrl=`https://smartygym.com/claim-gift?token=${gift.claim_token}`;
   const html=await render(React.createElement(SmartyGiftEmail,{senderName:gift.sender_name,recipientName:gift.recipient_name,message:gift.personal_message,claimUrl,stopUrl:`${claimUrl}&stop=true`,intro:config.content.lines?.join('\n')||DEFAULT_GIFT_INTRO}));
   const apiKey=process.env['LOVABLE_API_KEY'],resendKey=process.env['RESEND_API_KEY'];if(!apiKey||!resendKey)throw new Error('Gift reminder email service is not configured.');
   if(gift.reminder_email_sent_number!==gift.reminder_number){
   const response=await fetch('https://connector-gateway.lovable.dev/resend/emails',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`,'X-Connection-Api-Key':resendKey,'Idempotency-Key':`gift-reminder:${gift.id}:${gift.reminder_number}`},body:JSON.stringify({from:'SMARTYGYM <no-reply@smartygym.com>',to:[gift.recipient_email],subject:`${gift.sender_name}’s Smarty Gift is waiting for you`,html})});
   if(!response.ok) throw new Error(`Gift reminder email rejected (${response.status}): ${await response.text()}`);
   const result=await response.json() as {id?:string;message?:string};if(!result.id)throw new Error(result.message||'Gift reminder email was not accepted.');
   const {error:markedError}=await db.from('smarty_gifts').update({reminder_email_sent_number:gift.reminder_number}).eq('id',gift.id);if(markedError)throw new Error(markedError.message);
   }
   const {data:profile}=await db.from('profiles').select('id').eq('email',gift.recipient_email).limit(1).maybeSingle();
   if(profile) await inbox(db,profile.id,'Your Smarty Gift is waiting',gift.personal_message,`smarty-gift:${gift.claim_token}:reminder-${gift.reminder_number}`,`/claim-gift?token=${gift.claim_token}`);
   const nextNumber=gift.reminder_number+1;const nextAt=new Date(Date.now()+7*86400000).toISOString();
   const {error:updateError}=await db.from('smarty_gifts').update({reminder_number:nextNumber,next_reminder_at:nextAt,reminder_lease_until:null}).eq('id',gift.id).eq('status','paid').eq('reminder_number',gift.reminder_number);if(updateError)throw new Error(updateError.message);sent++;
  } catch(e){await db.from('smarty_gifts').update({reminder_lease_until:null}).eq('id',gift.id);failures.push(e instanceof Error?e.message:'Gift reminder failed');}
 }
 return {status:failures.length?'failed' as const:'ok' as const,changed:sent>0,summary:`${sent} gift reminder(s) accepted; ${stopped} stopped; ${failures.length} failure(s).`,failures};
}
