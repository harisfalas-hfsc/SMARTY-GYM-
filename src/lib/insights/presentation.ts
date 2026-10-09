import type { WeeklyInsights } from './compute';
export const LOAD_TEXT: Record<string,string> = {
 None: 'No logged training this week.',
 'Limited Data': 'Not enough logged data yet to judge your load.',
 Low: 'Low compared with your own recent weeks.',
 Moderate: 'Moderate, in line with your own recent weeks.',
 High: 'High compared with your own recent weeks.',
 'Very High': 'Very high compared with your own recent weeks.',
};
export const fmtInsightDate = (iso:string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
const MARKER='\n\n[SMARTY_INSIGHTS_V1]\n';
export function encodeInsightMessage(summary:string,report:WeeklyInsights) { return summary+MARKER+JSON.stringify(report); }
export function decodeInsightMessage(body:string|null): {summary:string;report:WeeklyInsights|null} {
 const [summary,payload]=(body??'').split(MARKER);
 if(!payload) return {summary,report:null};
 try {
  const report=JSON.parse(payload) as WeeklyInsights;
  if(!report.weekStart || !report.kpis || !Array.isArray(report.tips) || !Array.isArray(report.load?.recent)) return {summary,report:null};
  return {summary,report};
 } catch { return {summary,report:null}; }
}
