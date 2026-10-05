import logoUrl from "@/assets/smartygym-icon-transparent.png";

type RGB = [number, number, number];
type ExportKind = "method" | "investment";

const COLORS = {
  ink: [25, 31, 42] as RGB,
  muted: [92, 104, 122] as RGB,
  line: [218, 225, 233] as RGB,
  blue: [35, 171, 224] as RGB,
};

const documents = {
  method: {
    title: "THE SMARTY METHOD",
    subtitle: "The complete performance system by Sports Scientist Haris Falas",
    filename: "smartygym-the-smarty-method.pdf",
  },
  investment: {
    title: "WHY INVEST IN SMARTYGYM",
    subtitle: "The complete guide, research, charts and references",
    filename: "smartygym-why-invest.pdf",
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

export async function exportBrandPagePdf(kind: ExportKind, root: HTMLElement) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas-pro"),
    document.fonts.ready,
  ]);
  const content = documents[kind];
  const logo = await imageDataUrl(logoUrl);
  const originalWidth = root.style.width;
  const originalMaxWidth = root.style.maxWidth;
  root.style.width = "1136px";
  root.style.maxWidth = "none";
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-block]"));
  if (!blocks.length) throw new Error("No printable page content was found.");

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = 210;
  const H = 297;
  const left = 14;
  const printableWidth = 182;
  const contentTop = 38;
  const contentBottom = H - 20;
  let page = 1;
  let y = contentTop;

  const decoratePage = () => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, "F");
    doc.addImage(logo, "PNG", left, 7, 15, 15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.ink);
    doc.text(content.title, 34, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(content.subtitle, 34, 20);
    doc.setDrawColor(...COLORS.blue);
    doc.setLineWidth(1.1);
    doc.line(left, 29, W - left, 29);
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.3);
    doc.line(left, H - 15, W - left, H - 15);
    doc.setFontSize(7.2);
    doc.setTextColor(...COLORS.muted);
    doc.text("SMARTYGYM  |  Your Gym Re-imagined. Anywhere, Anytime.", left, H - 9);
    doc.text(`smartygym.com  |  Page ${page}`, W - left, H - 9, { align: "right" });
  };
  const newPage = () => {
    doc.addPage();
    page += 1;
    decoratePage();
    y = contentTop;
  };

  decoratePage();
  try {
  for (const block of blocks) {
    const canvas = await html2canvas(block, {
      backgroundColor: "#ffffff",
      scale: 1.65,
      useCORS: true,
      logging: false,
      windowWidth: 1200,
      onclone: (clonedDocument) => {
        clonedDocument.documentElement.classList.remove("dark");
        clonedDocument.documentElement.style.colorScheme = "light";
        clonedDocument.querySelectorAll<HTMLElement>("[data-pdf-exclude]").forEach((node) => {
          node.style.display = "none";
        });
        clonedDocument.querySelectorAll<HTMLElement>("*").forEach((node) => {
          node.style.animation = "none";
          node.style.transition = "none";
        });
      },
    });
    const imageHeight = (canvas.height * printableWidth) / canvas.width;
    const gap = 5;
    if (y > contentTop && y + imageHeight > contentBottom) newPage();

    if (imageHeight <= contentBottom - contentTop) {
      doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", left, y, printableWidth, imageHeight, undefined, "FAST");
      y += imageHeight + gap;
      continue;
    }

    const pixelsPerMm = canvas.width / printableWidth;
    let sourceY = 0;
    while (sourceY < canvas.height) {
      if (y > contentTop) newPage();
      const availableHeight = contentBottom - y;
      const sliceHeight = Math.min(canvas.height - sourceY, Math.floor(availableHeight * pixelsPerMm));
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceHeight;
      const context = slice.getContext("2d");
      if (!context) throw new Error("The PDF page could not be rendered.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, slice.width, slice.height);
      context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      const sliceMm = sliceHeight / pixelsPerMm;
      doc.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", left, y, printableWidth, sliceMm, undefined, "FAST");
      sourceY += sliceHeight;
      y += sliceMm + gap;
      if (sourceY < canvas.height) newPage();
    }
  }
  } finally {
    root.style.width = originalWidth;
    root.style.maxWidth = originalMaxWidth;
  }

  doc.save(content.filename);
}