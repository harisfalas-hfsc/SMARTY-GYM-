import { describe, it, expect } from 'vitest';
import { decodeInsightMessage, encodeInsightMessage, LOAD_TEXT } from './presentation';
import { insightsEmailHtml } from './insights.server';
import { chartPng } from './email-chart.server';
import { decode } from 'fast-png';
import { computeWeeklyInsights } from './compute';
const report=computeWeeklyInsights({workouts:[],checkins:[],progress:null,load:{state:'Limited Data',recent:[{weekStart:'2026-09-28',sessions:2},{weekStart:'2026-10-05',sessions:0}]},weekStart:'2026-10-05',today:'2026-10-12',toLocalDate:iso=>iso.slice(0,10)});
describe('Insights channel parity',()=>{
 it('preserves every report value in the inbox snapshot',()=>{expect(decodeInsightMessage(encodeInsightMessage('Hello',report))).toEqual({summary:'Hello',report});});
 it('keeps old messages readable and rejects invalid snapshots',()=>{expect(decodeInsightMessage('Old message')).toEqual({summary:'Old message',report:null});expect(decodeInsightMessage('Hello\n\n[SMARTY_INSIGHTS_V1]\n{')).toEqual({summary:'Hello',report:null});});
 it('includes both graphs, all tips, load interpretation and explicit weekly values in email',async()=>{
  const html=await insightsEmailHtml(report,'Haris',{activity:'https://example.test/activity.png',load:'https://example.test/load.png'});
  expect(html.match(/<img /g)).toHaveLength(2);
  expect(html).toContain(LOAD_TEXT[report.load.state]);
  expect(html).toContain('28 Sept: 2');expect(html).toContain('5 Oct: 0');
  for(const t of report.tips){expect(html).toContain(t.title);expect(html).toContain(t.body);}
  expect(html).toContain('What you didn');expect(html).toContain('#insights');expect(html).not.toContain('width:22px;height:');
 });
 it('creates a small valid PNG using the same thin-line chart data',()=>{
  const bytes=chartPng([{label:'Mon',value:0},{label:'Tue',value:2}],[58,185,214]);
  const image=decode(bytes);expect(image.width).toBe(1000);expect(image.height).toBe(240);expect(bytes.length).toBeLessThan(20000);
 });
});
