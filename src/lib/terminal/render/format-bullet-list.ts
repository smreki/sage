export function formatBulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}
