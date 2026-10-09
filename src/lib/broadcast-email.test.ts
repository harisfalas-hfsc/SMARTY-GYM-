import { describe, expect, it } from "vitest";
import { broadcastEmailHtml, type BroadcastEmail } from "./broadcast-email.server";
import {
  newWorkoutAnnouncement,
  sharedWorkoutAnnouncement,
  announcementInboxContent,
  wantsAnnouncementEmail,
  adminBroadcastAnnouncement,
} from "./broadcast-content";

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
  it("honors independent email opt-outs without changing mandatory inbox content", () => {
    const preferences = { email_new_workouts: false, email_shared_workouts: true };
    expect(wantsAnnouncementEmail(preferences, "new-workout:sample")).toBe(false);
    expect(wantsAnnouncementEmail(preferences, "shared-workout:sample")).toBe(true);
    expect(wantsAnnouncementEmail({ email_new_workouts: true, email_shared_workouts: false }, "new-workout:sample")).toBe(true);
    expect(wantsAnnouncementEmail({ email_shared_workouts: false }, "shared-workout:sample")).toBe(false);
    expect(wantsAnnouncementEmail({}, "new-workout:sample")).toBe(true);
    expect(announcementInboxContent(newWorkoutAnnouncement("sample", "Solid Lift")).body).toContain("Solid Lift");
  });

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
    expect(html).toContain('data-email-brand-footer="true"');
    expect(html).toContain('href="https://smartygym.com"');
    expect(html).toContain("Your Gym Reimagined</p>");
    expect(html).toContain("Anytime, Anywhere.</p>");
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

  it("builds a deduped admin broadcast email with its own title, body and CTA", () => {
    const broadcast = adminBroadcastAnnouncement("Gym news", "We are adding new features this week.", "2026-10-09T12:00:00Z");
    expect(broadcast.dedupeKey).toBe("admin-broadcast:2026-10-09T12:00:00Z");
    expect(broadcast.subject).toBe("Gym news");
    expect(broadcast.heading).toBe("Gym news");
    expect(broadcast.body).toBe("We are adding new features this week.");
    expect(broadcast.buttonHref).toBe("https://smartygym.com");
    expect(broadcast.buttonLabel).toBe("Open SMARTYGYM");
    // Unknown dedupe prefix: every account is eligible regardless of the
    // new-workout / shared-workout email toggles.
    expect(wantsAnnouncementEmail({ email_new_workouts: false, email_shared_workouts: false }, broadcast.dedupeKey)).toBe(true);
    const html = broadcastEmailHtml(broadcast);
    expect(html).toContain("Gym news");
    expect(html).toContain("We are adding new features this week.");
    expect(html).toContain("Open SMARTYGYM");
  });
});