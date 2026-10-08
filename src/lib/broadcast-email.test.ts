import { describe, expect, it } from "vitest";
import { broadcastEmailHtml, type BroadcastEmail } from "./broadcast-email.server";
import { newWorkoutAnnouncement, sharedWorkoutAnnouncement, announcementInboxContent } from "./broadcast-content";

const email: BroadcastEmail = {
  dedupeKey: "new-workout:sample",
  subject: "🏋️ New Workout: Solid Lift",
  heading: "New Workout Added!",
  body: "A new workout has been added to the SMARTYGYM library!",
  workoutName: "Solid Lift",
  supportingText: "Designed by Sports Scientist HARIS FALAS to help you achieve your fitness goals.",
  buttonHref: "https://smartygym.com/smarty-workouts/sample",
  buttonLabel: "View Workout",
};

describe("workout announcement email", () => {
  it("matches new workout app content to email content", () => {
    const announcement = newWorkoutAnnouncement("sample", "Power & Pace");
    const inbox = announcementInboxContent(announcement);
    expect(inbox.title).toBe(announcement.heading);
    expect(inbox.body).toBe([announcement.body, announcement.workoutName, announcement.supportingText].join("\n\n"));
    expect(inbox.dedupeKey).toBe(announcement.dedupeKey);
    expect(announcement.buttonLabel).toBe("View Workout");
  });

  it("matches shared creator and workout details without exposing creation method", () => {
    const announcement = sharedWorkoutAnnouncement("sample", "Full Body Momentum", "Andreas Nicolaou", "creator-id");
    const inbox = announcementInboxContent(announcement);
    expect(inbox.title).toBe(announcement.heading);
    expect(inbox.body).toContain(announcement.body);
    expect(inbox.body).toContain("Full Body Momentum");
    expect(inbox.body).toContain("Created by Andreas Nicolaou.");
    expect(announcement.exclude).toBe("creator-id");
    expect(announcement.buttonHref).toBe("https://smartygym.com/community/workout/sample");
    expect(inbox.body).not.toMatch(/Coach|Build It Yourself/);
  });

  it("preserves old header, content, workout name, CTA and footer in fluid tables", () => {
    const html = broadcastEmailHtml(email);
    expect(html).toContain("max-width:600px");
    expect(html).not.toContain('width="600"');
    expect(html).toContain("#29B6D2");
    expect(html.indexOf("SMARTYGYM</h1>")).toBeLessThan(html.indexOf("New Workout Added!</h2>"));
    expect(html.indexOf("Solid Lift</p>")).toBeLessThan(html.indexOf(">View Workout</a>"));
    expect(html).toContain('href="https://smartygym.com/privacy"');
    expect(html).not.toContain("/userdashboard");
  });

  it("uses the same shared layout without exposing creation method", () => {
    const html = broadcastEmailHtml({ ...email, heading: "New Shared Workout!", body: "Haris just shared a workout.", supportingText: "Created by HARIS FALAS.", buttonHref: "https://smartygym.com/community/workout/sample" });
    expect(html).toContain("Created by HARIS FALAS.");
    expect(html).toContain("/community/workout/sample");
    expect(html).not.toMatch(/Smarty Coach|Build It Yourself/);
  });

  it("escapes dynamic workout and creator text", () => {
    const html = broadcastEmailHtml({ ...email, workoutName: '<img src=x onerror="alert(1)">', supportingText: "Creator <script>" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img");
    expect(html).toContain("Creator &lt;script&gt;");
  });
});