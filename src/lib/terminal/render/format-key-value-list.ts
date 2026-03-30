type KeyValueItem = {
  label: string;
  value: string;
};

export function formatKeyValueList(items: KeyValueItem[]): string {
  return items.map((item) => `- ${item.label}: ${item.value}`).join("\n");
}
