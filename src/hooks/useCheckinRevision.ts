import { useEffect, useState } from "react";
import { subscribeToCheckinChanges } from "@/lib/checkins/changes";

/** Re-run open, live views after either check-in is successfully saved. */
export function useCheckinRevision() {
  const [revision, setRevision] = useState(0);
  useEffect(() => subscribeToCheckinChanges(window, () => setRevision(value => value + 1)), []);
  return revision;
}