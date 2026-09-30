/** Site-wide icon chip colours: each icon gets its own colour (see .icon-tone-N in styles.css). */
export function iconTone(key: string | number): string {
  if (typeof key === "number") return `icon-tone-${Math.abs(key) % 8}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return `icon-tone-${Math.abs(h) % 8}`;
}
