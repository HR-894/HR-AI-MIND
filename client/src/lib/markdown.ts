import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function sanitizeMarkdown(content: string): string {
  const html = marked(content) as string;
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "code", "pre",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "a",
      "table", "thead", "tbody", "tr", "th", "td"
    ],
    ALLOWED_ATTR: ["href", "class"],
    FORBID_TAGS: ["script", "style", "iframe", "img"],
    FORBID_ATTR: ["onerror", "onclick", "onload"],
  });
}
