import { describe, expect, it } from "vitest";
import { auditTransferredWorkouts, hasExerciseDemonstration, sectionSequence, type TransferExercise, type TransferWorkout } from "../smarty-transfer-audit";

const html = `<h3>🧽 Soft Tissue Preparation</h3><p>Foam roll for two minutes.</p><h3>🔥 Activation</h3><p>{{exercise:move-1:March}} — 10 reps</p><h3>💪 Main Workout</h3><p>{{exercise:move-1:March}} — 20 reps</p><h3>🧘 Cool Down</h3><p>{{exercise:move-1:March}} — 30 seconds</p>`;
const workout: TransferWorkout = { id: "w1", legacy_id: "OLD-1", name: "Workout", category: "STRENGTH", format: "REPS & SETS", difficulty_stars: 2, duration_min: 30, equipment: ["bodyweight"], image_url: "/cover.jpg", description_html: "Description", instructions_html: "Instructions", tips_html: "Tips", main_workout: html, is_visible: false };
const exercise: TransferExercise = { id: "move-1", name: "March", description: "March in place with control.", instructions: ["Stand tall.", "Lift one knee.", "Switch sides."], gif_path: null, is_active: true };

describe("Smarty Workout transfer audit", () => {
  it("accepts ordered legacy sections and a guided demonstration", () => {
    expect(sectionSequence(html)).toEqual(["Soft Tissue Preparation", "Activation", "Main Workout", "Cool-down"]);
    expect(hasExerciseDemonstration(exercise)).toBe(true);
    expect(auditTransferredWorkouts([workout], [exercise])).toMatchObject({ total: 1, clean: 1, ready: true, guidedDemonstrations: 1, missingDemonstrations: 0 });
  });

  it("blocks publishing when a required section, cover, or demonstration is missing", () => {
    const report = auditTransferredWorkouts([{ ...workout, image_url: null, main_workout: html.replace(/<h3>🔥 Activation<\/h3>/, "") }], [{ ...exercise, description: null, instructions: [] }]);
    expect(report.ready).toBe(false);
    expect(report.workouts[0]?.issues).toEqual(expect.arrayContaining(["Missing cover picture", "Required sections are missing or out of order", "Exercise March has no demonstration"]));
  });
});