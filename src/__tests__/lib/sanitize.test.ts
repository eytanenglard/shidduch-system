import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  stripHtml,
  sanitizeText,
  sanitizeRichText,
  sanitizeObject,
} from '@/lib/sanitize';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should not modify safe text', () => {
    expect(escapeHtml('Hello world 123')).toBe('Hello world 123');
  });

  it('should escape Hebrew text with special chars', () => {
    expect(escapeHtml('שלום & ברוכים <הבאים>')).toBe(
      'שלום &amp; ברוכים &lt;הבאים&gt;'
    );
  });
});

describe('stripHtml', () => {
  it('should strip all HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('should strip script tags', () => {
    expect(stripHtml('<script>alert(1)</script>text')).toBe('alert(1)text');
  });

  it('should handle text without tags', () => {
    expect(stripHtml('plain text')).toBe('plain text');
  });
});

describe('sanitizeText', () => {
  it('should strip HTML and trim', () => {
    expect(sanitizeText('  <b>Hello</b>  ')).toBe('Hello');
  });

  it('should limit length', () => {
    const long = 'a'.repeat(100);
    expect(sanitizeText(long, 50)).toHaveLength(50);
  });

  it('should handle empty/null-like input', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText(null as any)).toBe('');
    expect(sanitizeText(undefined as any)).toBe('');
    expect(sanitizeText(123 as any)).toBe('');
  });

  it('should remove XSS attempts', () => {
    expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('');
    expect(sanitizeText('<script>document.cookie</script>')).toBe('document.cookie');
  });
});

describe('sanitizeRichText', () => {
  it('should keep allowed tags', () => {
    const input = '<p>Hello <b>world</b></p>';
    const result = sanitizeRichText(input);
    expect(result).toContain('<p>');
    expect(result).toContain('<b>');
  });

  it('should strip script tags completely', () => {
    const result = sanitizeRichText('<p>Safe</p><script>alert(1)</script>');
    expect(result).not.toContain('script');
    expect(result).toContain('Safe');
  });

  it('should strip event handlers', () => {
    const result = sanitizeRichText('<p onclick="alert(1)">Click me</p>');
    expect(result).not.toContain('onclick');
    expect(result).toContain('Click me');
  });

  it('should strip javascript: URLs', () => {
    const result = sanitizeRichText('<a href="javascript:alert(1)">Link</a>');
    expect(result).not.toContain('javascript');
  });

  it('should limit length', () => {
    const long = '<p>' + 'a'.repeat(20000) + '</p>';
    expect(sanitizeRichText(long, 100).length).toBeLessThanOrEqual(100);
  });
});

describe('sanitizeObject', () => {
  it('should sanitize string fields', () => {
    const result = sanitizeObject({
      name: '<script>bad</script>John',
      age: 25,
      bio: '<p>Hello</p>',
    });
    expect(result.name).toBe('badJohn');
    expect(result.age).toBe(25);
    expect(result.bio).toBe('Hello');
  });

  it('should handle rich text fields', () => {
    const result = sanitizeObject(
      { content: '<p>Hello <b>world</b></p><script>bad</script>' },
      { richTextFields: ['content'] }
    );
    expect(result.content).toContain('<p>');
    expect(result.content).not.toContain('script');
  });

  it('should handle nested objects', () => {
    const result = sanitizeObject({
      user: { name: '<b>Test</b>', email: 'test@test.com' },
    });
    expect((result.user as any).name).toBe('Test');
  });

  it('should respect maxStringLength', () => {
    const result = sanitizeObject(
      { text: 'a'.repeat(100) },
      { maxStringLength: 50 }
    );
    expect((result.text as string).length).toBe(50);
  });
});
