create table public.smarty_workouts_backup_mobility_lists_20261004 as select * from public.smarty_workouts;
alter table public.smarty_workouts_backup_mobility_lists_20261004 enable row level security;
grant all on public.smarty_workouts_backup_mobility_lists_20261004 to service_role;

-- Mobility & Stability main work: off-list twist -> listed Pilates spine twist (2 workouts)
update public.smarty_workouts set main_workout=replace(main_workout,'{{exercise:3639:bent knee lying twist}}','{{exercise:pilates-spine-twist:Spine Twist Pilates}}'), updated_at=now()
where id in ('f6e038fc-d725-4ddd-9ce2-835850a2c041','2fca7a54-1b15-4958-b545-b4c6c05aca07');

-- Challenge main work: first push to run -> run (5 workouts)
update public.smarty_workouts set main_workout=regexp_replace(main_workout,'\{\{exercise:3638:push to run\}\}','{{exercise:0685:run}}'), updated_at=now()
where id in ('69af15a3-769a-48c8-a928-ee749bbc294f','8502ee0c-8ad1-4539-921a-6112bfbb255d','01f4b9b4-1d7a-49fd-ad58-e760c8d20c85','f27c77f7-946e-458c-b3fe-d924558eded5')
   or id = (select id from public.smarty_workouts where name='Axial Current Initiate' limit 1);

-- Warm-up / cool-down swaps to the closed animated lists
update public.smarty_workouts set main_workout=
  replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(main_workout,
  '{{exercise:recovery-ankle-rocks:Ankle Rocks}}','{{exercise:1368:ankle circles}}'),
  '{{exercise:recovery-hip-cars:Hip CARs}}','{{exercise:1418:hug knees to chest}}'),
  '{{exercise:recovery-scapular-wall-slides:Scapular Wall Slides}}','{{exercise:3011:incline scapula push up}}'),
  '{{exercise:pilates-chest-lift-rotation:Chest Lift With Rotation}}','{{exercise:pilates-spine-twist:Spine Twist Pilates}}'),
  '{{exercise:recovery-9090-hip-rotation:90/90 Hip Rotation}}','{{exercise:3639:bent knee lying twist}}'),
  '{{exercise:3635:dumbbell contralateral forward lunge}}','{{exercise:1685:squat to overhead reach}}'),
  '{{exercise:recovery-cross-body-shoulder-stretch:Cross-body Shoulder Stretch}}','{{exercise:1405:back pec stretch}}'),
  '{{exercise:recovery-cervical-side-bend:Cervical Side Bend Stretch}}','{{exercise:1403:neck side stretch}}'),
  '{{exercise:pilates-corkscrew:Corkscrew}}','{{exercise:pilates-spine-twist:Spine Twist Pilates}}'),
  '{{exercise:pilates-hip-twist:Hip Twist}}','{{exercise:3639:bent knee lying twist}}'),
  '{{exercise:pilates-roll-up:Roll-up}}','{{exercise:0276:dead bug}}'),
  '{{exercise:3635:dumbbell contralateral forward lunge}}','{{exercise:1685:squat to overhead reach}}'),
  updated_at=now()
where main_workout ~ '(recovery-ankle-rocks|recovery-hip-cars|recovery-scapular-wall-slides|pilates-chest-lift-rotation|recovery-9090-hip-rotation|exercise:3635:|recovery-cross-body-shoulder-stretch|recovery-cervical-side-bend|pilates-corkscrew|pilates-hip-twist|pilates-roll-up)';