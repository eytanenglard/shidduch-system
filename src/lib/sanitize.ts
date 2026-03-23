/**
 * Input sanitization utilities to prevent XSS and injection attacks.
 * Used for user-supplied content before storing in DB.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

const HTML_ESCAPE_REGEX = /[&<>"'/]/g;

/**
 * Escapes HTML special characters to prevent XSS.
 * Use for plain text fields (names, feedback, notes).
 */
export function escapeHtml(input: string): string {
  return input.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Strips all HTML tags from a string.
 * Use for fields that should never contain HTML.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizes user input: trims, strips HTML, and limits length.
 * This is the default sanitizer for most text fields.
 */
export function sanitizeText(input: string, maxLength = 5000): string {
  if (!input || typeof input !== 'string') return '';
  return stripHtml(input).trim().slice(0, maxLength);
}

/**
 * Sanitizes rich text content (from editors like Quill).
 * Allows basic formatting tags but strips dangerous ones.
 */
export function sanitizeRichText(input: string, maxLength = 10000): string {
  if (!input || typeof input !== 'string') return '';

  const allowedTags = ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'a', 'span'];
  const allowedAttrs = ['href', 'target', 'rel', 'class', 'dir', 'style'];

  // Strip script tags and event handlers
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/on\w+\s*=[^\s>]*/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:/gi, 'blocked:');

  // Strip tags that aren't in the allowed list
  sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      // Keep the tag but strip non-allowed attributes
      return match.replace(/\s+([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, (attrMatch, attrName) => {
        if (allowedAttrs.includes(attrName.toLowerCase())) return attrMatch;
        return '';
      });
    }
    return '';
  });

  return sanitized.trim().slice(0, maxLength);
}

/**
 * Sanitizes an object's string fields recursively.
 * Useful for sanitizing entire request bodies.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: { maxStringLength?: number; richTextFields?: string[] } = {}
): T {
  const { maxStringLength = 5000, richTextFields = [] } = options;
  const result = { ...obj };

  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      if (richTextFields.includes(key)) {
        (result as Record<string, unknown>)[key] = sanitizeRichText(value, maxStringLength);
      } else {
        (result as Record<string, unknown>)[key] = sanitizeText(value, maxStringLength);
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>,
        options
      );
    }
  }

  return result;
}
