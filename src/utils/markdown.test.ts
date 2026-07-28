import { describe, expect, it } from 'vitest';
import { parseBlocks, sanitizeUrl, type Block } from './markdown';

describe('sanitizeUrl', () => {
  it('allows http, https and mailto', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('mailto:a@b.com')).toBe('mailto:a@b.com');
  });

  it('blocks javascript and data URLs (XSS guard)', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl('data:text/html,<script>')).toBeNull();
    expect(sanitizeUrl('  vbscript:msgbox  ')).toBeNull();
  });
});

describe('parseBlocks', () => {
  it('parses headings with their level', () => {
    const blocks = parseBlocks('# Title\n## Sub');
    expect(blocks).toEqual<Block[]>([
      { type: 'heading', level: 1, text: 'Title' },
      { type: 'heading', level: 2, text: 'Sub' },
    ]);
  });

  it('groups consecutive list items into one block', () => {
    const blocks = parseBlocks('- a\n- b\n- c');
    expect(blocks).toEqual<Block[]>([{ type: 'ul', items: ['a', 'b', 'c'] }]);
  });

  it('parses ordered lists', () => {
    const blocks = parseBlocks('1. first\n2. second');
    expect(blocks).toEqual<Block[]>([{ type: 'ol', items: ['first', 'second'] }]);
  });

  it('captures fenced code verbatim', () => {
    const blocks = parseBlocks('```\nconst x = 1;\n```');
    expect(blocks).toEqual<Block[]>([{ type: 'code', code: 'const x = 1;' }]);
  });

  it('treats blank-line-separated text as separate paragraphs', () => {
    const blocks = parseBlocks('para one\n\npara two');
    expect(blocks).toEqual<Block[]>([
      { type: 'paragraph', text: 'para one' },
      { type: 'paragraph', text: 'para two' },
    ]);
  });

  it('parses blockquotes', () => {
    const blocks = parseBlocks('> quoted');
    expect(blocks).toEqual<Block[]>([{ type: 'quote', text: 'quoted' }]);
  });
});
