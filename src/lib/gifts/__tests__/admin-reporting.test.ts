import {describe,it,expect} from 'vitest';
import {memberKind,giftSalesInRange,giftGross,type GiftSale} from '../admin-reporting';
const sale:GiftSale={id:'gift',buyer_email:'buyer@example.com',sender_name:'Maria',recipient_name:'Alex',recipient_email:'alex@example.com',environment:'live',status:'paid',paid_at:'2026-10-23T10:00:00Z'};
const from='2026-10-01T00:00:00Z',to='2026-10-31T23:59:59Z';
describe('Admin gift reporting',()=>{
 it('counts a free member without paid or gifted access',()=>expect(memberKind({subscriptionActive:false,complimentary:false,giftActive:false})).toBe('member'));
 it('classifies active gift recipients distinctly',()=>expect(memberKind({subscriptionActive:false,complimentary:false,giftActive:true})).toBe('gift'));
 it('keeps paying members separate from gifts',()=>expect(memberKind({subscriptionActive:true,complimentary:false,giftActive:true})).toBe('subscriber'));
 it('keeps complimentary members separate',()=>expect(memberKind({subscriptionActive:true,complimentary:true,giftActive:false})).toBe('complimentary'));
 it('adds exactly 4.99 per paid gift to gross revenue',()=>expect(giftGross(giftSalesInRange([sale,{...sale,id:'2',status:'claimed'}],'live',from,to))).toBe(9.98));
 it('excludes sandbox sales from live revenue',()=>expect(giftSalesInRange([{...sale,environment:'sandbox'}],'live',from,to)).toHaveLength(0));
 it('excludes pending and released orders',()=>expect(giftSalesInRange([{...sale,status:'pending'},{...sale,status:'released'}],'live',from,to)).toHaveLength(0));
 it('counts refunded sales in gross receipts, not as new income',()=>expect(giftGross(giftSalesInRange([{...sale,status:'refunded'}],'live',from,to))).toBe(4.99));
 it('honours selected date range',()=>expect(giftSalesInRange([{...sale,paid_at:'2026-09-30T23:59:59Z'},{...sale,paid_at:null}],'live',from,to)).toHaveLength(0));
});
