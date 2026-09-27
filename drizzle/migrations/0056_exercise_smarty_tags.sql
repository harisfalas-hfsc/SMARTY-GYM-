ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS smarty_tags text[] NOT NULL DEFAULT '{}';

UPDATE public.exercises SET smarty_tags = (
  SELECT COALESCE(array_agg(DISTINCT t), '{}')
  FROM (
    SELECT unnest(ARRAY[
      CASE WHEN category = 'strength' THEN 'strength' END,
      CASE WHEN category = 'cardio' THEN 'cardio' END,
      CASE WHEN category = 'plyometrics' THEN 'hiit' END,
      CASE WHEN category IN ('mobility', 'balance') THEN 'mobility' END,
      CASE WHEN category = 'stretching' THEN 'flexibility' END,
      CASE WHEN body_part = 'waist' THEN 'core' END,
      CASE WHEN category IN ('mobility', 'balance') AND difficulty = 'beginner' THEN 'activation' END,
      CASE WHEN category IN ('stretching', 'rehabilitation') THEN 'cool-down' END,
      CASE WHEN (
        category IN ('cardio', 'plyometrics')
        OR (category = 'strength' AND lower(equipment) LIKE '%body weight%'
            AND difficulty IN ('intermediate', 'advanced'))
      ) THEN 'challenge' END
    ]) AS t
  ) tags
  WHERE t IS NOT NULL
);

CREATE INDEX IF NOT EXISTS exercises_smarty_tags_idx ON public.exercises USING GIN (smarty_tags);