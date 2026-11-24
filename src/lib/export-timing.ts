export async function withExportDeadline<T>(work: Promise<T>, message: string, milliseconds = 30_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
    })]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
}

export async function withExportProgress<T>(
  work: (report: (message: string) => void) => Promise<T>,
  report: (message: string) => void,
  message: string,
  milliseconds = 30_000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let active = true;
  let reset = () => {};
  const stalled = new Promise<never>((_, reject) => {
    reset = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
    };
    reset();
  });
  try {
    return await Promise.race([work(value => { if (active) { reset(); report(value); } }), stalled]);
  } finally { active = false; if (timer !== undefined) clearTimeout(timer); }
}