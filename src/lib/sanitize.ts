import sanitize from "sanitize-html";

/**
 * Sanitize HTML content for safe rendering.
 * Defense-in-depth — the backend already sanitizes on save,
 * but we re-sanitize before `dangerouslySetInnerHTML`.
 */
export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    disallowedTagsMode: "discard",
  });
}
