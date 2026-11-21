/** Shared score-color bands; scoring, coaching and calibration stay unchanged. */
export function readinessBand(score: number | null | undefined): "low" | "moderate" | "ready" | "uncalibrated" {
  if (score == null || !Number.isFinite(score)) return "uncalibrated";
  return score >= 8 ? "ready" : score >= 4 ? "moderate" : "low";
}

export function readinessTone(score: number | null | undefined) {
  switch (readinessBand(score)) {
    case "low": return "text-readiness-low border-readiness-low";
    case "moderate": return "text-readiness-moderate border-readiness-moderate";
    case "ready": return "text-readiness-ready border-readiness-ready";
    default: return "text-muted-foreground border-border";
  }
}