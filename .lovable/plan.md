# Full rule audit and fix of all 530 Smarty Workouts

## Why the side plank got through
Your rules weren't wrong. My earlier check used only part of them.
- The engine has two layers of rules: the **workout checker** and the **exercise filter**, which decides which exercises a session may use at all.
- My audit used only the checker. The ban on static holds (planks, side planks, wall sits, hollow holds) in Challenge, Cardio, Calorie Burning and Metabolic lives only in the filter, so the audit never saw it.
- When I swapped in priority exercises, "bodyweight incline side plank" was on the priority list, so it went into a Challenge AMRAP. On top of that, it was prescribed as "10 reps", which makes no sense for a hold.
- Several other filter rules were skipped the same way, and so were the structure checks (duration budgets, doses, whether the activation suits the main work).

## Step 0: one rule engine instead of two layers
Before any audit, I merge the two layers into a single rule engine, so there is only one set of rules.
- Every rule lives in one place, with one entry per exercise and one per workout. That covers today's filter rules, today's checker rules, the Activation and Cool Down vocabulary, and the format, structure, duration, level and equipment rules.
- Each user of the rules asks this one engine:
  - the Workout of the Day
  - Create Your Workout
  - admin Smarty Workouts generation
  - the audit and fix of stored workouts
- The exercise filter keeps an exercise only if the engine allows it. The checker rejects a workout only if the engine finds a break. No rule exists anywhere else.
- A test blocks any new rule from being added outside the engine. Another test proves the filter and the checker always agree. Whatever the filter allows, the checker accepts, and the other way round.
- Workouts you generate today come out the same, because no rule is relaxed. The only change is that nothing can be checked against half the rules again.

## What the new audit checks: every rule in the one engine, on every workout

**1. Activation and Cool Down**
- Only mobility, stability and stretch movements, 2 to 4 per section, no repeats.
- Activation must prepare the body area and movement pattern of the Main Workout.
- Section length must stay inside its time allowance.

**2. Main Workout and Finisher: every engine rule, filter and checker together**
- No static holds in Challenge, Cardio, Calorie Burning or Metabolic.
- No stretching or mobility moves in Challenge work.
- Category bans: Pilates, Mobility & Stability, Recovery and Micro Workouts each have their own list of exercises they never use.
- No unrealistic or high-skill moves. No setup-heavy equipment, balance tools or isolation machines under a clock.
- A Challenge must be full-body, mostly bodyweight and built from challenge-tagged material.
- Cardio must stay aerobic. No technical move right after a high-fatigue move.
- No more equipment families than the category and format allow.
- Priority share of at least 70% in the categories that use priority lists.
- Beginner workouts must not contain moves the library marks as advanced.
- A bodyweight workout must contain only bodyweight exercises. An equipment workout must use only the equipment it lists.

**3. Format and structure by category, duration, level and equipment**
- The format must be legal for the category, for example Strength is Reps & Sets only.
- No Finisher in categories that never carry one. A Finisher must be present where the category requires one.
- Minimum number of exercises in the Main Workout.
- Every exercise must have a prescribed dose, and it must fit the movement: holds are timed, never counted in reps.
- Work time must match the advertised duration. The whole session must stay inside its budget.

## How it runs
1. **Audit (read-only, no credits).** I run the full rule set on all 530 workouts and post a breakdown in chat: each rule, how many workouts break it, and the categories affected.
2. **Fix right after the audit, without waiting for another approval:**
   - Rule-breaking exercises are swapped for legal ones. The pool keeps the same movement pattern, body area and equipment. Priority exercises are used only in Main Workout and Finisher. Activation and Cool Down use only their own vocabulary.
   - A dose that doesn't fit is corrected: a hold becomes seconds, and a rep move stays reps.
   - Structure problems are corrected by adjusting rounds, sets and time, or by adding or removing a Finisher. Names, pictures, category, level and descriptions stay the same.
   - No AI is used.
3. **A swap is accepted only if the workout then passes every rule.** If a workout can't be made fully compliant, it stays unchanged and is named in the report.
4. **Backup first.** Every workout's current content is saved before any write.
5. **Verify:**
   - Re-run the full audit on the live data. The target is 0 rule breaks, apart from workouts listed by name.
   - Re-check that every exercise in every workout is linked and has its picture.
   - Re-check Athletic Challenge Builder and one workout from each of the 9 categories line by line.
   - Run all tests and the build.

## Technical details
- `smarty-compliance.ts`:
  - `complianceIssues` gains the filter-only rules from `pool.server.ts`: `STATIC_HOLD_RE` for the momentum categories, `HIGH_SKILL_RE`, challenge `smarty_tags` preference, the beginner/advanced rule, and bodyweight/equipment-mode consistency.
  - It also gains the structural checks from `validate.server.ts`: `activationRelevanceViolation`, the duration, activation, cooldown, session and budget overflow checks, the minimum Main Workout and Finisher counts, dose present, and the hold-dose check.
  - Swap candidates are filtered by the same per-exercise predicates, so a static or forbidden exercise can never be a candidate.
- The rule set is shared, so the generator and the stored-workout audit can't drift apart again. A regression test asserts that all 530 stored workouts pass (fixture snapshot), and adds specific cases: no plank in a Challenge AMRAP, and a hold dosed as reps is rejected.
- Reports:
  - Backup: `audits/smarty-workouts-pre-full-audit-2026-10-02.json`
  - Before/after report: `audits/smarty-workouts-full-audit-2026-10-02.json`
