import { describe, expect, it } from "vitest";
import { blogShareDetails, blogSharePayload } from "./blog-share";

describe("blog article sharing", () => {
  it("shares the article's own public page, not the blog index or preview origin", () => {
    expect(blogShareDetails({ slug: "mastery-over-novelty", title: "Mastery over novelty", excerpt: null }).url)
      .toBe("https://smartygym.com/blog/mastery-over-novelty");
  });
  it("includes the picture with the article link when device sharing accepts files", () => {
    const file = { name: "article.png", type: "image/png" } as File;
    const details = blogShareDetails({ slug: "mastery-over-novelty", title: "Mastery over novelty", excerpt: null });
    expect(blogSharePayload(details, file, true)).toEqual({ ...details, files: [file] });
  });
  it("retains the article link when file sharing is unsupported", () => {
    const details = blogShareDetails({ slug: "mastery-over-novelty", title: "Mastery over novelty", excerpt: null });
    expect(blogSharePayload(details, { name: "article.png" } as File, false)).toEqual(details);
    expect(blogSharePayload(details, null, true)).toEqual(details);
  });
});