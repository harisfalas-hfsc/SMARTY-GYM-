import { describe, expect, it } from "vitest";
import { blogPdfContents, type ExportArticle } from "./blog-export";
import { ritualPdfContents } from "./ritual-export";
import { contentPictureSource } from "./content-pdf";

describe("read-only content PDF exports", () => {
  it("loads app-owned pictures from the current app while preserving external sources", () => {
    expect(contentPictureSource("https://smartygym.com/api/public/blog-cover/article.png", "http://localhost:8080")).toBe("http://localhost:8080/api/public/blog-cover/article.png");
    expect(contentPictureSource("https://example.com/image.jpg", "http://localhost:8080")).toBe("https://example.com/image.jpg");
  });
  it("keeps each article's cover and full stored content in selection order without changing it", () => {
    const article: ExportArticle = { title: "Training", excerpt: null, content: '<p>Complete article <a href="/wod">Daily plan</a></p>', category: "Fitness", read_time: "5 min", published_at: null, is_published: false, image_url: "https://smartygym.com/cover.jpg", slug: "training" };
    const before = structuredClone(article);
    const documents = blogPdfContents([article, { ...article, title: "Recovery", content: "Original recovery text" }]);
    expect(documents.map(document => document.title)).toEqual(["Training", "Recovery"]);
    expect(documents[0]?.cover).toBe(article.image_url);
    expect(documents[0]?.sections).toEqual([{ html: article.content }]);
    expect(documents[1]?.sections).toEqual([{ html: "Original recovery text" }]);
    expect(article).toEqual(before);
  });
  it("includes all three ritual phases and prescriptions without changing the source", () => {
    const ritual = { number: 18, morning_content: "<p>3 sets × 8 reps</p>", midday_content: '<p><a href="/tools">Tools</a></p>', evening_content: "<p>Rest 60 sec — Recover</p>" };
    const before = structuredClone(ritual);
    const documents = ritualPdfContents([ritual]);
    expect(documents[0]?.sections.map(section => section.html)).toEqual([ritual.morning_content, ritual.midday_content, ritual.evening_content]);
    expect(ritual).toEqual(before);
  });
});