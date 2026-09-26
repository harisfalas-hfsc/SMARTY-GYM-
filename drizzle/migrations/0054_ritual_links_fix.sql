UPDATE public.smarty_rituals SET
 morning_content = replace(replace(morning_content,'href="/workout/wod"','href="/wod"'),'<p>TESTEDIT</p>',''),
 midday_content = replace(midday_content,'href="/workout/wod"','href="/wod"'),
 evening_content = replace(evening_content,'href="/workout/wod"','href="/wod"');