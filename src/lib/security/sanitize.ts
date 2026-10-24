import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "strong", "em", "u", "s", "del", "code", "pre",
  "blockquote",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "th", "td",
  "a", "span",
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  th: ["colspan", "rowspan", "colwidth"],
  td: ["colspan", "rowspan", "colwidth"],
  span: ["class", "data-type"],
  pre: ["class"],
  code: ["class"],
};

export function sanitizeContentHtml(html: string): string {
  if (!html) return "";

  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}

export function sanitizePlainText(text: string): string {
  if (!text) return "";
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}
