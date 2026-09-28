INSERT INTO public.badge_definitions (id, category, name, description, threshold, icon, points, sort_order) VALUES
('chk_14','checkins','14 Day Check-in Streak','14 consecutive complete check-in days',14,'flame',50,301),
('chk_60','checkins','60 Day Check-in Streak','60 consecutive complete check-in days',60,'flame',200,303),
('chk_180','checkins','180 Day Check-in Streak','180 consecutive complete check-in days',180,'flame',600,305),
('chk_270','checkins','270 Day Check-in Streak','270 consecutive complete check-in days',270,'flame',1200,306),
('chk_365','checkins','365 Day Check-in Streak','A full year of consecutive complete check-in days',365,'flame',2500,307)
ON CONFLICT (id) DO NOTHING;
UPDATE public.badge_definitions SET sort_order = 300 WHERE id = 'chk_7';
UPDATE public.badge_definitions SET sort_order = 302 WHERE id = 'chk_30';
UPDATE public.badge_definitions SET sort_order = 304 WHERE id = 'chk_90';