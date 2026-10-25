import { describe, expect, it } from "vitest";
import { exportedPlayerSlides } from "./workout-html-export";
import { packageHtmlFiles, safeJson } from "./standalone-html";
import JSZip from "jszip";

describe("admin standalone exports", () => {
  it("keeps the original dose and shared Tabata interval timing without performance fields", () => {
    const slides = exportedPlayerSlides('<h2>Main Workout</h2><p>{{exercise:0276:Dead Bug}} — Tabata 4 intervals, 20 sec work, 10 sec rest</p>');
    expect(slides).toEqual([{ kind: "exercise", stepIndex: 0, step: { exerciseId: "0276", name: "Dead Bug", prescription: "Tabata 4 intervals, 20 sec work, 10 sec rest", section: "Main Workout", subSection: "Tabata" }, timing: { mode: "tabata", work: 20, rest: 10, rounds: 4 } }]);
  });
  it("packages every selected card once even when names duplicate", async () => {
    const result = await packageHtmlFiles([{ name: "same.html", html: "first" }, { name: "same.html", html: "second" }], "workouts");
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(result.filename).toBe("workouts.zip");
    expect(Object.keys(zip.files)).toEqual(["001-same.html", "002-same.html"]);
    expect(await zip.file("001-same.html")?.async("string")).toBe("first");
    expect(await zip.file("002-same.html")?.async("string")).toBe("second");
  });
  it("delivers one selection as HTML, not a ZIP", async () => {
    const result = await packageHtmlFiles([{ name: "ritual-1.html", html: "complete ritual" }], "rituals");
    expect(result.filename).toBe("ritual-1.html");
    expect(result.blob.type).toBe("text/html;charset=utf-8");
    expect(await result.blob.text()).toBe("complete ritual");
  });
  it("rejects empty selections and keeps script payloads safe", async () => {
    await expect(packageHtmlFiles([], "empty")).rejects.toThrow("Select at least one item");
    const data = { name: '</script><script>alert("test")</script>' };
    expect(safeJson(data)).not.toContain("<");
    expect(JSON.parse(safeJson(data))).toEqual(data);
  });
});