import { GIFT_AMOUNT } from './rules';
export type MemberKind = 'subscriber' | 'complimentary' | 'gift' | 'member';
export function memberKind(input:{subscriptionActive:boolean;complimentary:boolean;giftActive:boolean}):MemberKind {
 if(input.subscriptionActive)return input.complimentary?'complimentary':'subscriber';
 return input.giftActive?'gift':'member';
}
export type GiftSale = {id:string; buyer_email:string; sender_name:string; recipient_name:string; recipient_email:string; environment:string; status:string; paid_at:string|null};
export function giftSalesInRange(gifts:GiftSale[],environment:string,from:string,to:string) {
 return gifts.filter(g=>g.environment===environment&&['paid','claimed','refunded'].includes(g.status)&&g.paid_at!==null&&Date.parse(g.paid_at)>=Date.parse(from)&&Date.parse(g.paid_at)<=Date.parse(to));
}
export function giftGross(gifts:GiftSale[]) {return gifts.length*GIFT_AMOUNT/100;}
