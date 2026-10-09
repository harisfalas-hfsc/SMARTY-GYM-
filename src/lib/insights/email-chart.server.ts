import { encode } from 'fast-png';
import type { SupabaseClient } from '@supabase/supabase-js';
import { reportChartGeometry, REPORT_LINE_WIDTH, REPORT_DOT_RADIUS, type ReportChartPoint } from '@/lib/report-chart';
export function chartPng(points:ReportChartPoint[],color:[number,number,number]) {
 const width=1000,height=240,data=new Uint8Array(width*height*3).fill(255);
 const paint=(x:number,y:number,r:number,rgb:number[])=>{
  for(let py=Math.max(0,Math.floor(y-r));py<=Math.min(height-1,Math.ceil(y+r));py++)
   for(let px=Math.max(0,Math.floor(x-r));px<=Math.min(width-1,Math.ceil(x+r));px++) {
    if((px-x)**2+(py-y)**2>r*r) continue;
    const n=(py*width+px)*3; data[n]=rgb[0];data[n+1]=rgb[1];data[n+2]=rgb[2];
   }
 };
 const line=(a:{x:number;y:number},b:{x:number;y:number},r:number,rgb:number[])=>{
  const steps=Math.ceil(Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y))*2);
  for(let n=0;n<=steps;n++){const t=steps?n/steps:0;paint(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,r,rgb);}
 };
 for(let n=0;n<=4;n++) line({x:20,y:20+n*50},{x:980,y:20+n*50},0.5,[230,235,241]);
 let prev:{x:number;y:number}|null=null;
 for(const p of reportChartGeometry(points).points){
  if(p.y===null){prev=null;continue;}
  const current={x:20+p.x*960,y:20+p.y*200};
  if(prev)line(prev,current,REPORT_LINE_WIDTH,color);
  paint(current.x,current.y,REPORT_DOT_RADIUS*2,color);prev=current;
 }
 return encode({width,height,data,channels:3});
}
export async function storeEmailChart(db:SupabaseClient,points:ReportChartPoint[],color:[number,number,number]) {
 const bucket=db.storage.from('insights-email-charts'),path=`${crypto.randomUUID()}.png`;
 const {error}=await bucket.upload(path,chartPng(points,color),{contentType:'image/png',upsert:false});
 if(error)throw new Error('Insights graph could not be stored');
 const {data,error:signError}=await bucket.createSignedUrl(path,31536000);
 if(signError||!data?.signedUrl)throw new Error('Insights graph could not be prepared');
 return data.signedUrl;
}
