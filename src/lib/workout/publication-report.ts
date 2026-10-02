// Admin-facing explanations for the existing Smarty rule gate.
// This module never decides legality: it only adds context to failures returned
// by complianceIssues(), using the same rule functions that produced them.
import * as D from "./doctrine";
import { estimateActivationMinutes, estimateCooldownMinutes, estimateWorkMinutes } from "./enforce.server";
import { parseWorkoutSteps, type WorkoutStep } from "./parse-steps";
import {
  ACTIVATION_MAX_REPS,
  ACTIVATION_MAX_SECONDS,
  activationDoseViolation,
  prepAllowed,
} from "./prep-vocabulary";
import {
  complianceRuleLabel,
  type ComplianceExercise,
  type ComplianceWorkout,
} from "./smarty-compliance";
import { legalFormats, type Category, type DifficultyLevel, type Format } from "./spec";
import {
  LIGHT_SET_CAP,
  doseRuleBreak,
  exerciseRuleBreaks,
  holdDoseViolation,
  workoutRuleBreaks,
} from "./rules";

const LEVELS: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];

function line(rule: string, fields: Array<[string, string | number | null | undefined]>, correction: string) {
  const details = fields.filter(([, value]) => value !== null && value !== undefined && value !== "").map(([label, value]) => `${label}: ${value}.`);
  return [`Publication blocked — ${rule}.`, ...details, correction].join(" ");
}

function equipmentLabel(row: ComplianceExercise | undefined) {
  return row?.equipment?.trim() || "Bodyweight";
}

function sectionSteps(steps: WorkoutStep[], section: string) {
  return steps.filter((step) => step.section === section);
}

/** Converts blocking issue labels into precise admin guidance without changing gate decisions. */
export function publicationRuleReports(
  workout: ComplianceWorkout,
  library: ComplianceExercise[],
  blockingIssues: string[],
): string[] {
  const html = workout.main_workout ?? "";
  const steps = parseWorkoutSteps(html);
  const lib = new Map(library.map((exercise) => [exercise.id, exercise]));
  const category = workout.category as Category;
  const format = (workout.format ?? "") as Format;
  const level = LEVELS[workout.difficulty_stars - 1] ?? "intermediate";
  const bodyweightOnly = Array.isArray(workout.equipment) && (workout.equipment.length === 0 || workout.equipment.every((item) => /body ?weight/i.test(item)));
  const ctx = { category, format, level, section: "work" as const, bodyweightOnly };
  const reports = new Map<string, string>();
  const add = (issue: string, message: string) => {
    if (blockingIssues.includes(issue) && !reports.has(issue)) reports.set(issue, message);
  };

  for (const step of steps) {
    const row = lib.get(step.exerciseId);
    const exerciseName = row?.name ?? step.name;
    if (step.section === "Main Workout" || step.section === "Finisher") {
      if (!/\d/.test(step.prescription)) {
        add("Exercise without a dose", line("Dose Rule", [["Section", step.section], ["Exercise", exerciseName], ["Current", step.prescription || "No dose"]], "Add a clear time, reps, or sets prescription."));
      }
      if (doseRuleBreak(category, step.prescription)) {
        add("Too many sets for a light category", line("Light-Category Dose Rule", [["Section", step.section], ["Exercise", exerciseName], ["Current", step.prescription], ["Allowed", `maximum ${LIGHT_SET_CAP} sets`]], `Reduce this exercise to ${LIGHT_SET_CAP} sets or fewer.`));
      }
      if (row) {
        for (const raw of exerciseRuleBreaks(row, ctx)) {
          const issue = complianceRuleLabel(raw);
          add(issue, line(`${issue} Rule`, [["Section", step.section], ["Exercise", exerciseName], ["Equipment", equipmentLabel(row)]], `${raw} Replace or adjust this exercise so it matches the workout category, format, level, and equipment.`));
        }
      }
    }

    const hold = holdDoseViolation(exerciseName, step.prescription);
    if (hold) {
      add("Hold or stretch dosed in reps", line("Static Hold Dose Rule", [["Section", step.section], ["Exercise", exerciseName], ["Current", step.prescription], ["Allowed", "a time-based dose"]], "Replace the rep count with seconds or minutes."));
    }

    if (step.section === "Activation" || step.section === "Warm-up") {
      if (activationDoseViolation(exerciseName, step.prescription)) {
        add("Activation dose above 10 reps / 30 sec or in sets", line("Activation Rule", [["Section", "Activation"], ["Exercise", exerciseName], ["Current", step.prescription], ["Allowed", `maximum ${ACTIVATION_MAX_REPS} reps total or ${ACTIVATION_MAX_SECONDS} sec, with no working sets`]], "Reduce the activation dose."));
      }
      if (!prepAllowed(exerciseName, "activation")) {
        add("Activation not mobility/stability", line("Activation Vocabulary Rule", [["Section", "Activation"], ["Exercise", exerciseName], ["Equipment", equipmentLabel(row)]], "Use a low-fatigue mobility, stability, joint-preparation, activation, or light movement-rehearsal exercise."));
      }
    }
    if (step.section === "Cool-down" && !prepAllowed(exerciseName, "cooldown")) {
      add("Cool Down not stretch/mobility", line("Cool Down Vocabulary Rule", [["Section", "Cool Down"], ["Exercise", exerciseName], ["Equipment", equipmentLabel(row)]], "Use a recovery-focused stretch, gentle mobility movement, or breathing exercise."));
    }
  }

  const mainSteps = sectionSteps(steps, "Main Workout");
  const finisherSteps = sectionSteps(steps, "Finisher");
  const mainRows = mainSteps.map((step) => lib.get(step.exerciseId)).filter((row): row is ComplianceExercise => Boolean(row));
  const finisherRows = finisherSteps.map((step) => lib.get(step.exerciseId)).filter((row): row is ComplianceExercise => Boolean(row));
  const workRows = [...mainRows, ...finisherRows];

  if (mainRows.length < 3) add("Main Workout has fewer than 3 exercises", line("Workout Structure Rule", [["Section", "Main Workout"], ["Current", `${mainRows.length} exercises`], ["Allowed", "at least 3 exercises"]], "Add enough legal Main Workout exercises."));
  if (!D.categoryAllowsFinisher(category) && finisherSteps.length) add("Finisher in a category that never has one", line("Finisher Structure Rule", [["Section", "Finisher"], ["Current", `${finisherSteps.length} exercises`], ["Allowed", `no Finisher for ${category}`]], "Remove the Finisher section exercises."));

  for (const raw of workoutRuleBreaks(workRows, mainRows, { category, format, level }, finisherRows)) {
    const issue = complianceRuleLabel(raw);
    if (issue === "Finisher introduces new equipment") {
      const mainFamilies = new Set(mainRows.map((row) => D.equipmentFamilyOf(row.equipment)));
      const index = finisherRows.findIndex((row) => {
        const family = D.equipmentFamilyOf(row.equipment);
        return family !== "bodyweight" && !mainFamilies.has(family);
      });
      const row = index >= 0 ? finisherRows[index] : undefined;
      add(issue, line("Equipment Flow Rule", [["Section", "Finisher"], ["Exercise", row?.name], ["Equipment", equipmentLabel(row)]], "This introduces new equipment that was not used in the Main Workout. Use existing workout equipment or bodyweight."));
    } else if (/station|picks the same equipment back up/i.test(raw)) {
      const section = raw.startsWith("Finisher") ? "Finisher" : "Main Workout";
      const block = section === "Finisher" ? finisherRows : mainRows;
      const seen = new Set<string>();
      let previous = "";
      let culprit: ComplianceExercise | undefined;
      for (const row of block) {
        const family = D.equipmentFamilyOf(row.equipment);
        if (family !== previous && seen.has(family)) { culprit = row; break; }
        seen.add(family);
        previous = family;
      }
      add(issue, line("Equipment Flow Rule", [["Section", section], ["Exercise", culprit?.name], ["Equipment", culprit ? equipmentLabel(culprit) : undefined]], `${raw} Group each equipment family into one continuous block.`));
    } else {
      add(issue, line(`${issue} Rule`, [["Section", "Main Workout / Finisher"], ["Current", raw]], "Correct the workout structure or exercise balance described above."));
    }
  }

  const formatIssue = D.categoryFormatViolation(category, format);
  if (formatIssue) add("Format not allowed for category", line("Category Format Rule", [["Current", `${category} / ${format || "No format"}`], ["Allowed", legalFormats(category).join(", ")]], "Choose one of the allowed formats for this category."));

  const activation = sectionSteps(steps, "Activation");
  const cooldown = sectionSteps(steps, "Cool-down");
  if (activation.length < 2) add("Activation has fewer than 2 movements", line("Activation Structure Rule", [["Section", "Activation"], ["Current", `${activation.length} movements`], ["Allowed", "at least 2 movements"]], "Add legal activation movements."));
  if (cooldown.length < 2) add("Cool Down has fewer than 2 movements", line("Cool Down Structure Rule", [["Section", "Cool Down"], ["Current", `${cooldown.length} movements`], ["Allowed", "at least 2 movements"]], "Add legal cool-down movements."));

  for (const [section, block] of [["Activation", activation], ["Cool Down", cooldown]] as const) {
    const duplicate = block.find((step, index) => block.findIndex((candidate) => candidate.exerciseId === step.exerciseId) !== index);
    if (duplicate) add("Repeated exercise in Activation/Cool Down", line("Prep Variety Rule", [["Section", section], ["Exercise", lib.get(duplicate.exerciseId)?.name ?? duplicate.name], ["Current", "repeated in the same section"], ["Allowed", "each movement once per section"]], "Remove the duplicate or replace it with another legal movement."));
  }

  if (workout.duration_min) {
    const target = workout.duration_min;
    const workMinutes = estimateWorkMinutes(html);
    const activationMinutes = estimateActivationMinutes(html);
    const cooldownMinutes = estimateCooldownMinutes(html);
    if (D.durationOverflowViolation(workMinutes, target)) add("Work time exceeds the advertised duration", line("Workout Duration Rule", [["Section", "Main Workout / Finisher"], ["Current", `approximately ${workMinutes} min`], ["Allowed", `${target} min advertised training time`]], "Reduce rounds, sets, work intervals, or rest so the prescription fits the advertised duration."));
    if (D.activationOverflowViolation(activationMinutes, target)) add("Activation too long", line("Activation Duration Rule", [["Section", "Activation"], ["Current", `approximately ${activationMinutes} min`], ["Allowed", `about ${D.activationAllowanceMinutes(target)} min`]], "Shorten the activation prescriptions."));
    if (D.cooldownOverflowViolation(cooldownMinutes, target)) add("Cool Down too long", line("Cool Down Duration Rule", [["Section", "Cool Down"], ["Current", `approximately ${cooldownMinutes} min`], ["Allowed", `about ${D.cooldownAllowanceMinutes(target)} min`]], "Shorten the cool-down prescriptions."));
  }

  return blockingIssues.map((issue) => reports.get(issue) ?? line(`${issue} Rule`, [["Current", issue]], "Correct this issue before publishing."));
}