update public.smarty_workouts s set main_workout=b.main_workout, updated_at=b.updated_at
from public.smarty_workouts_backup_mobility_lists_20261004 b
where s.id=b.id and s.category='PILATES' and s.main_workout<>b.main_workout
  and s.name <> 'Advanced Power Pilates';