export function extractJson(content: string) {
  const withoutFences = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Response did not include a JSON object.");
  }

  return withoutFences.slice(start, end + 1);
}
