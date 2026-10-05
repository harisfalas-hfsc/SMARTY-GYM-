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
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("[data-pdf-block]"));
  if (!blocks.length) throw new Error("No printable page content was found.");

  const exportRootMarker = `pdf-root-${Date.now()}`;
  root.dataset.pdfExportRoot = exportRootMarker;
  blocks.forEach((block, index) => {
    block.dataset.pdfExportBlock = String(index);
  });

  let clonedRootHeight = 0;
  let blockRanges: Array<{ top: number; height: number }> = [];
  let pageCanvas: HTMLCanvasElement;

  try {
    pageCanvas = await html2canvas(root, {
      backgroundColor: "#ffffff",
      scale: 1.35,
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

        const clonedRoot = clonedDocument.querySelector<HTMLElement>(
          `[data-pdf-export-root="${exportRootMarker}"]`,
        );
        if (!clonedRoot) return;
        clonedRoot.style.width = "1136px";
        clonedRoot.style.maxWidth = "none";
        const rootRect = clonedRoot.getBoundingClientRect();
        clonedRootHeight = rootRect.height;
        blockRanges = blocks.map((_, index) => {
          const block = clonedRoot.querySelector<HTMLElement>(
            `[data-pdf-export-block="${index}"]`,
          );
          const rect = block?.getBoundingClientRect();
          return {
            top: rect ? rect.top - rootRect.top : 0,
            height: rect?.height ?? 0,
          };
        });
      },
    });
  } finally {
    delete root.dataset.pdfExportRoot;
    blocks.forEach((block) => delete block.dataset.pdfExportBlock);
  }

  if (!clonedRootHeight || blockRanges.some((range) => range.height <= 0)) {
    throw new Error("The PDF page sections could not be measured.");
  }

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
  const pixelsPerCssPixel = pageCanvas.height / clonedRootHeight;
  const pixelsPerMm = pageCanvas.width / printableWidth;

  for (const range of blockRanges) {
    const blockTop = Math.max(0, Math.round(range.top * pixelsPerCssPixel));
    const blockBottom = Math.min(
      pageCanvas.height,
      Math.round((range.top + range.height) * pixelsPerCssPixel),
    );
    const blockHeight = Math.max(1, blockBottom - blockTop);
    const imageHeight = blockHeight / pixelsPerMm;
    const gap = 5;
    if (y > contentTop && y + imageHeight > contentBottom) newPage();

    if (imageHeight <= contentBottom - contentTop) {
      const blockCanvas = document.createElement("canvas");
      blockCanvas.width = pageCanvas.width;
      blockCanvas.height = blockHeight;
      const context = blockCanvas.getContext("2d");
      if (!context) throw new Error("The PDF page could not be rendered.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, blockCanvas.width, blockCanvas.height);
      context.drawImage(
        pageCanvas,
        0,
        blockTop,
        pageCanvas.width,
        blockHeight,
        0,
        0,
        blockCanvas.width,
        blockCanvas.height,
      );
      doc.addImage(blockCanvas.toDataURL("image/jpeg", 0.9), "JPEG", left, y, printableWidth, imageHeight, undefined, "FAST");
      y += imageHeight + gap;
      continue;
    }

    let sourceY = 0;
    while (sourceY < blockHeight) {
      if (y > contentTop) newPage();
      const availableHeight = contentBottom - y;
      const sliceHeight = Math.min(blockHeight - sourceY, Math.floor(availableHeight * pixelsPerMm));
      const slice = document.createElement("canvas");
      slice.width = pageCanvas.width;
      slice.height = sliceHeight;
      const context = slice.getContext("2d");
      if (!context) throw new Error("The PDF page could not be rendered.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, slice.width, slice.height);
      context.drawImage(
        pageCanvas,
        0,
        blockTop + sourceY,
        pageCanvas.width,
        sliceHeight,
        0,
        0,
        pageCanvas.width,
        sliceHeight,
      );
      const sliceMm = sliceHeight / pixelsPerMm;
      doc.addImage(slice.toDataURL("image/jpeg", 0.9), "JPEG", left, y, printableWidth, sliceMm, undefined, "FAST");
      sourceY += sliceHeight;
      y += sliceMm + gap;
      if (sourceY < blockHeight) newPage();
    }
  }

  doc.save(content.filename);
}