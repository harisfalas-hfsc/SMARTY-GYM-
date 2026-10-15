// The 30 MUSCLE BUILDING Smarty Workouts Haris ordered as Main Workout ONLY
// (no Activation, no Finisher, no Cool Down). This is the ONLY exception to the
// prep-section requirement in complianceIssues; every other workout keeps it.
export const MAIN_ONLY_WORKOUT_IDS: ReadonlySet<string> = new Set([
  "67676e4a-2f11-4460-90e2-309e70451c5b", "10ed0fed-a3c1-4886-bfa6-a809c0e79767", "7a886773-0328-44c6-833c-8a5fd77f8cbf",
  "27f7ee75-6d8d-44c5-a6ba-130cdab0c368", "ed1bbc90-0e78-45e0-9e8e-f0d59c9d9428", "52421a9e-7cb6-4d96-928c-086e438a9df7",
  "5f7a3bc1-77fb-4103-8a25-2fd2314850a2", "ad432eab-a1f3-45a3-9a67-64f69a390d85", "a81711e8-9085-4f8e-9514-0a30f4840965",
  "3898242d-19ca-446f-ac64-bed7b2f69e75", "e641a5c3-dc99-45ae-aadf-f97c5b1437ff", "4e58b963-6b25-4f5f-809f-09c521fde0be",
  "099951ee-0ab7-4bb0-8f6e-bd478fbb41bc", "d6bd1c0a-bac1-499e-934a-11350ce48a65", "a4a9e86e-92a2-4db2-aa91-3117371543c4",
  "254881d2-2301-4ebb-a733-5e2ce07111d0", "0f6a543b-5359-4005-a622-f210e734e50d", "b3202fa2-bc21-4265-99c2-c98ee4a28b75",
  "71936269-7b1d-40e6-8b2c-e662c4171d0f", "9a3ee208-c311-47c2-a8d2-c747edf1b614", "ef1803f6-4423-44d4-b4de-1b436e52a298",
  "389f57e7-d61b-4488-91dc-4b12b0fba5fa", "46bc31de-3a93-44c3-94a9-4e2d2c740d63", "c6456536-ab56-457f-8e18-1b089930490f",
  "8c6f086a-1e89-49c8-9ff5-a3a95fcf8f2e", "636f0640-b19a-48fd-ad0a-f688c36f9213", "de68962a-2bb0-4967-8e8c-227bf6d756b3",
  "61300184-2bc6-43df-a2fd-9d6f86518e97", "41e0a257-a920-4ae0-aa09-1bc5ff0fcd6e", "63385b8c-38f9-4cbc-8e48-580ec2fd405a",
]);

/** True only for one of the 30 listed MUSCLE BUILDING workouts. */
export const isMainOnlyWorkout = (w: { id: string; category: string }) =>
  w.category === "MUSCLE BUILDING" && MAIN_ONLY_WORKOUT_IDS.has(w.id);
