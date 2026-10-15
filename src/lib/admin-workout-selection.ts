/** Selection is always intersected with current results before an action. */
export function workoutSelectionScope<T extends { id: string }>(rows: T[], selected: ReadonlySet<string>) {
  const matchingSelected = rows.filter((row) => selected.has(row.id));
  return { selected: matchingSelected, targets: matchingSelected.length ? matchingSelected : rows };
}

export function visibilityTargets<T extends { id: string; is_visible: boolean }>(rows: T[], visible: boolean, failing: ReadonlySet<string>) {
  const candidates = rows.filter((row) => row.is_visible !== visible);
  return {
    ids: candidates.filter((row) => !visible || !failing.has(row.id)).map((row) => row.id),
    held: visible ? candidates.filter((row) => failing.has(row.id)).length : 0,
  };
}