import { describe, expect, it } from "vitest";
import { smartyCopy } from "../copy-bank.server";

type Row = {
  id: string;
  category: string;
  description_html: string | null;
  instructions_html: string | null;
  tips_html: string | null;
  difficulty_stars: number | null;
  duration_min: number | null;
  equipment: string[] | null;
};

function fakeDb(rows: Row[]) {
  return {
    from: () => ({
      select: async () => ({ data: rows }),
    }),
  } as never;
}

const STRENGTH_BEGINNER_BW: Row = {
  id: "a",
  category: "STRENGTH",
  description_html: "<p>Beginner bodyweight strength.</p>",
  instructions_html: "<p>Move with control.</p>",
  tips_html: "<p>Breathe.</p>",
  difficulty_stars: 1,
  duration_min: 30,
  equipment: ["bodyweight"],
};

const STRENGTH_ADV_GYM: Row = {
  id: "b",
  category: "STRENGTH",
  description_html: "<p>Advanced gym strength.</p>",
  instructions_html: "<p>Lift heavy.</p>",
  tips_html: "<p>Rest fully.</p>",
  difficulty_stars: 3,
  duration_min: 60,
  equipment: ["barbell", "dumbbell"],
};

const CARDIO_ROW: Row = {
  ...STRENGTH_BEGINNER_BW,
  id: "c",
  category: "CARDIO",
};

describe("smartyCopy", () => {
  it("picks the closest match on category, difficulty and equipment mode", async () => {
    const copy = await smartyCopy(fakeDb([STRENGTH_BEGINNER_BW, STRENGTH_ADV_GYM, CARDIO_ROW]), {
      category: "STRENGTH",
      stars: 1,
      equipmentMode: "BODYWEIGHT",
      minutes: 30,
    });
    expect(copy?.description_html).toContain("Beginner bodyweight strength");
  });

  it("prefers the equipment-mode match for gym workouts", async () => {
    const copy = await smartyCopy(fakeDb([STRENGTH_BEGINNER_BW, STRENGTH_ADV_GYM]), {
      category: "STRENGTH",
      stars: 3,
      equipmentMode: "EQUIPMENT",
      minutes: 60,
    });
    expect(copy?.description_html).toContain("Advanced gym strength");
  });

  it("returns null when no workout in the category has full copy", async () => {
    const copy = await smartyCopy(fakeDb([{ ...CARDIO_ROW, tips_html: null }]), {
      category: "CARDIO",
      stars: 1,
      equipmentMode: "BODYWEIGHT",
      minutes: 30,
    });
    expect(copy).toBeNull();
  });
});
