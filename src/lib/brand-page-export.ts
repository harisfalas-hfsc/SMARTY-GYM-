import logoUrl from "@/assets/smartygym-icon-transparent.png";

type RGB = [number, number, number];
type ExportKind = "method" | "investment";

const COLORS = {
  ink: [25, 31, 42] as RGB,
  muted: [92, 104, 122] as RGB,
  line: [218, 225, 233] as RGB,
  blue: [35, 171, 224] as RGB,
  green: [43, 178, 115] as RGB,
  amber: [240, 166, 35] as RGB,
  pink: [226, 72, 139] as RGB,
  violet: [129, 90, 213] as RGB,
  red: [224, 75, 75] as RGB,
};

const palette = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.pink, COLORS.violet, COLORS.red];

const documents = {
  method: {
    title: "THE SMARTY METHOD",
    subtitle: "A complete performance system by Sports Scientist Haris Falas",
    filename: "smartygym-the-smarty-method.pdf",
    lead: "Professional training, made practical.",
    intro: "SmartyGym brings professional programming, daily guidance, training records and community support into one connected system. Every coaching-led workout follows the same exercise, structure, dose and safety rules.",
    highlights: [
      ["COACHING", "Human-led", "A method shaped by more than 25 years of coaching experience."],
      ["GENERATION", "0 AI credits", "Smarty Coach builds sessions deterministically from approved rules and workout examples."],
      ["ACCESS", "Anywhere", "Train at home, outdoors, while travelling or in a gym."],
      ["PROGRESS", "One record", "Workouts, performance, awards and check-ins come together in your Logbook."],
    ],
    sections: [
      ["One coaching standard", "Smarty Workouts, Workout of the Day, Smarty Coach and admin-created sessions use one authoritative rule system. It controls legal exercises, section purpose, workout structure, prescription, duration and equipment flow while preserving the intent of each category and format.", ["Low-fatigue preparation", "Purposeful main training", "Compatible finishers", "Recovery-focused cool-down"]],
      ["Three ways to train", "Choose a ready-made Smarty Workout, follow the shared Workout of the Day, or create your own workout. Smarty Coach builds a rule-compliant session around your choices; Build It Yourself lets you choose directly from the exercise library.", ["Ready-made expert library", "Daily periodized workout", "Deterministic Smarty Coach", "Build It Yourself"]],
      ["Designed around real life", "Goals, experience, available time and equipment shape the session. Bodyweight-only means no equipment. The result is a practical workout with a clear purpose rather than a random collection of exercises.", ["Home, gym, outdoors or travel", "Beginner through advanced", "Multiple categories and formats", "Exercise demonstrations"]],
      ["The Logbook feedback loop", "Completed sessions build a personal record of training days, streaks, performance, awards and training load. Recent strength and conditioning work is compared with your own history, while missing measurements are never guessed.", ["Training Load and trends", "Scores, rank and awards", "Date-range progress PDF", "Readiness and check-ins"]],
      ["Consistency with flexibility", "Smarty Ritual supports a daily wellbeing practice. Smarty Check-ins record readiness and recovery. Shared Workouts and Community add encouragement, ratings and discussion without exposing private completion totals.", ["Daily ritual", "Morning and night check-ins", "Shared member workouts", "Private training history"]],
    ],
    chartTitle: "A connected training cycle",
    chartLabels: ["Plan", "Train", "Log", "Understand", "Progress"],
    chartValues: [42, 58, 68, 80, 92],
    closingTitle: "Structured enough to guide you. Flexible enough for real life.",
    closing: "The Smarty Method turns expert coaching principles into a practical system you can carry anywhere — with clear sessions, meaningful records and decisions grounded in the work you actually complete.",
  },
  investment: {
    title: "WHY INVEST IN SMARTYGYM",
    subtitle: "Why structured training is an investment in lasting performance",
    filename: "smartygym-why-invest.pdf",
    lead: "Put structure behind your effort.",
    intro: "Your health and physical capacity support the work, family life and experiences that matter to you. SmartyGym replaces scattered advice and random sessions with one practical, professionally structured training environment.",
    highlights: [
      ["MEMBERSHIP", "€9.99", "One flat monthly price with no VAT added."],
      ["PROGRAMMING", "Purposeful", "Workouts are matched to clear goals, formats and equipment."],
      ["GUIDANCE", "Daily", "Ready workouts, a shared daily workout and personal creation options."],
      ["EVIDENCE", "Your data", "Progress is based on your own recorded training, never invented values."],
    ],
    sections: [
      ["Structure removes guesswork", "A useful training plan needs more than exercises. It needs a clear objective, preparation, a compatible main block, an appropriate dose and recovery. SmartyGym keeps those decisions connected so each session has a reason to exist.", ["Expert Smarty Workouts", "Workout of the Day", "Deterministic Smarty Coach", "Build It Yourself"]],
      ["Consistency becomes visible", "The Logbook records completed workouts and performance. Scores, streaks, awards, rank and training analytics make progress easier to understand, while a complete date-range PDF gives members a portable view of their training history.", ["Workout and performance history", "Training Load science", "Progress graphs and awards", "Complete progress PDF"]],
      ["Support beyond the workout", "Smarty Check-ins connect morning readiness and evening recovery. Smarty Ritual offers a focused daily practice. The exercise library, timers, rounds tracker and 1RM calculator support the work before, during and after training.", ["Readiness and recovery", "Daily ritual", "Exercise demonstrations", "Practical training tools"]],
      ["Motivation with privacy", "Members can share workouts, like, rate and comment, while private completion totals and training records remain private. A shared workout can become part of another member's own Logbook without changing the creator's original.", ["Shared Workouts", "Community encouragement", "Public badges and streaks", "Private personal records"]],
      ["One gym that travels", "SmartyGym works across phone, tablet and desktop, with options for bodyweight or available equipment. It gives busy adults, parents, travellers, beginners and experienced trainees a clear place to begin and continue.", ["Home", "Gym", "Outdoors", "Travel"]],
    ],
    chartTitle: "How the system supports progress",
    chartLabels: ["Access", "Structure", "Consistency", "Insight", "Confidence"],
    chartValues: [55, 68, 78, 86, 94],
    closingTitle: "An investment in every part of life.",
    closing: "SmartyGym combines expert structure, practical flexibility and personal evidence in one affordable membership — so training is easier to start, easier to sustain and easier to understand.",
  },
} as const;

async function imageDataUrl(src: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error("The SMARTYGYM logo could not be loaded.");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The SMARTYGYM logo could not be prepared."));
    reader.readAsDataURL(blob);
  });
}

export async function exportBrandPagePdf(kind: ExportKind) {
  const { jsPDF } = await import("jspdf");
  const content = documents[kind];
  const logo = await imageDataUrl(logoUrl);
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = 210;
  const H = 297;
  let page = 1;
  let y = 42;

  const footer = () => {
    doc.setDrawColor(...COLORS.line);
    doc.line(14, H - 15, W - 14, H - 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.text("SMARTYGYM  |  Your Gym Re-imagined. Anywhere, Anytime.", 14, H - 9);
    doc.text(`smartygym.com  |  Page ${page}`, W - 14, H - 9, { align: "right" });
  };
  const header = () => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, "F");
    doc.addImage(logo, "PNG", 14, 9, 18, 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...COLORS.ink);
    doc.text(content.title, 38, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(content.subtitle, 38, 23);
    doc.setDrawColor(...COLORS.blue);
    doc.setLineWidth(1.2);
    doc.line(14, 32, W - 14, 32);
    footer();
    y = 42;
  };
  const newPage = () => { doc.addPage(); page += 1; header(); };
  const need = (height: number) => { if (y + height > H - 22) newPage(); };
  const paragraph = (text: string, x: number, width: number, color = COLORS.muted, size = 9, lineHeight = 4.8) => {
    const lines = doc.splitTextToSize(text, width) as string[];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(lines, x, y, { lineHeightFactor: lineHeight / (size * 0.3528) });
    y += lines.length * lineHeight;
  };

  header();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.ink);
  doc.text(content.lead, 14, y + 2);
  y += 12;
  paragraph(content.intro, 14, 182, COLORS.muted, 10, 5.4);
  y += 5;

  const gap = 4;
  const cardWidth = (182 - gap * 3) / 4;
  need(43);
  content.highlights.forEach((item, index) => {
    const x = 14 + index * (cardWidth + gap);
    const color = palette[index] ?? COLORS.blue;
    doc.setDrawColor(...COLORS.line);
    doc.roundedRect(x, y, cardWidth, 37, 2, 2, "S");
    doc.setFillColor(...color);
    doc.rect(x, y, 2.2, 37, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...color);
    doc.text(item[0], x + 6, y + 7);
    doc.setFontSize(12.5);
    doc.setTextColor(...COLORS.ink);
    doc.text(item[1], x + 6, y + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.1);
    doc.setTextColor(...COLORS.muted);
    doc.text((doc.splitTextToSize(item[2], cardWidth - 10) as string[]).slice(0, 3), x + 6, y + 23, { lineHeightFactor: 1.25 });
  });
  y += 48;

  content.sections.forEach((section, index) => {
    const color = palette[index % palette.length] ?? COLORS.blue;
    const bodyLines = doc.splitTextToSize(section[1], 168) as string[];
    const boxHeight = 32 + bodyLines.length * 4.4 + Math.ceil(section[2].length / 2) * 9;
    need(boxHeight + 8);
    const top = y;
    doc.setDrawColor(...COLORS.line);
    doc.roundedRect(14, top, 182, boxHeight, 2, 2, "S");
    doc.setFillColor(...color);
    doc.rect(14, top, 2.4, boxHeight, "F");
    y += 8;
    doc.setFillColor(...color);
    doc.circle(21, y + 2, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(String(index + 1), 21, y + 3.2, { align: "center" });
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.ink);
    doc.text(section[0], 29, y + 3.5);
    y += 12;
    paragraph(section[1], 20, 168, COLORS.muted, 8.5, 4.4);
    y += 3;
    section[2].forEach((bullet, bulletIndex) => {
      const col = bulletIndex % 2;
      const row = Math.floor(bulletIndex / 2);
      const x = 20 + col * 86;
      const bulletY = y + row * 9;
      doc.setFillColor(...color);
      doc.circle(x + 2, bulletY + 2.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.4);
      doc.setTextColor(...COLORS.ink);
      doc.text(bullet, x + 7, bulletY + 4);
    });
    y = top + boxHeight + 8;
  });

  need(70);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.ink);
  doc.text(content.chartTitle, 14, y + 4);
  y += 12;
  const chartX = 22;
  const chartWidth = 166;
  const chartHeight = 40;
  doc.setDrawColor(...COLORS.line);
  [0, 0.5, 1].forEach((ratio) => doc.line(chartX, y + chartHeight * ratio, chartX + chartWidth, y + chartHeight * ratio));
  content.chartValues.forEach((value, index) => {
    const barGap = chartWidth / content.chartValues.length;
    const barHeight = (value / 100) * chartHeight;
    const color = palette[index] ?? COLORS.blue;
    doc.setFillColor(...color);
    doc.roundedRect(chartX + index * barGap + 7, y + chartHeight - barHeight, 18, barHeight, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.ink);
    doc.text(content.chartLabels[index] ?? "", chartX + index * barGap + 16, y + chartHeight + 6, { align: "center" });
  });
  y += 57;

  need(52);
  doc.setDrawColor(...COLORS.blue);
  doc.setLineWidth(0.8);
  doc.roundedRect(14, y, 182, 42, 2, 2, "S");
  doc.setFillColor(...COLORS.blue);
  doc.circle(21, y + 10, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...COLORS.ink);
  doc.text(content.closingTitle, 29, y + 12);
  y += 21;
  paragraph(content.closing, 20, 168, COLORS.muted, 8.5, 4.5);

  doc.save(content.filename);
}