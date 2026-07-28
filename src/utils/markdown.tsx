import type { ReactNode } from 'react';

/**
 * Minimal, safe Markdown renderer.
 *
 * It builds React nodes directly (React escapes all text), so there is NO
 * `dangerouslySetInnerHTML` and therefore no HTML-injection surface. Only a
 * documented subset is supported — enough for personal notes:
 *
 *   # Headings (levels 1–3)   **bold**   *italic* / _italic_   `code`
 *   > blockquote              - / * lists   1. ordered lists
 *   ```code fences```          [links](https://…)
 *
 * The block/inline parsing core (`parseBlocks`, `sanitizeUrl`) is pure and
 * unit-tested; the React assembly is a thin layer over it.
 */

const SAFE_URL_SCHEME = /^(https?:\/\/|mailto:)/i;

/** Allow only http(s)/mailto links; everything else is rendered as plain text. */
export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim();
  return SAFE_URL_SCHEME.test(trimmed) ? trimmed : null;
}

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'code'; code: string }
  | { type: 'quote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'paragraph'; text: string };

const HEADING = /^(#{1,3})\s+(.*)$/;
const UL_ITEM = /^[-*]\s+(.*)$/;
const OL_ITEM = /^\d+\.\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const FENCE = /^```/;

/** Split raw markdown into a flat list of block descriptors (pure). */
export function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    if (FENCE.test(line)) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !FENCE.test(lines[i] ?? '')) {
        code.push(lines[i] ?? '');
        i += 1;
      }
      i += 1; // consume closing fence
      blocks.push({ type: 'code', code: code.join('\n') });
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      const level = Math.min((heading[1] ?? '#').length, 3) as 1 | 2 | 3;
      blocks.push({ type: 'heading', level, text: heading[2] ?? '' });
      i += 1;
      continue;
    }

    if (UL_ITEM.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UL_ITEM.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').match(UL_ITEM)?.[1] ?? '');
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (OL_ITEM.test(line)) {
      const items: string[] = [];
      while (i < lines.length && OL_ITEM.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').match(OL_ITEM)?.[1] ?? '');
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (QUOTE.test(line)) {
      const parts: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i] ?? '')) {
        parts.push((lines[i] ?? '').match(QUOTE)?.[1] ?? '');
        i += 1;
      }
      blocks.push({ type: 'quote', text: parts.join('\n') });
      continue;
    }

    // Paragraph: consecutive plain lines (soft-wrapped).
    const paragraph: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? '').trim() !== '' &&
      !FENCE.test(lines[i] ?? '') &&
      !HEADING.test(lines[i] ?? '') &&
      !UL_ITEM.test(lines[i] ?? '') &&
      !OL_ITEM.test(lines[i] ?? '') &&
      !QUOTE.test(lines[i] ?? '')
    ) {
      paragraph.push(lines[i] ?? '');
      i += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join('\n') });
  }

  return blocks;
}

const INLINE =
  /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)|(\[[^\]]+\]\([^)]+\))/g;

/** Parse inline emphasis/code/links within a text run into React nodes. */
function parseInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;

  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const token = match[0];
    const id = `${keyBase}-${key++}`;

    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={id}
          className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/10"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={id}>{parseInline(token.slice(2, -2), id)}</strong>);
    } else if (token.startsWith('*')) {
      nodes.push(<em key={id}>{parseInline(token.slice(1, -1), id)}</em>);
    } else if (token.startsWith('_')) {
      nodes.push(<em key={id}>{parseInline(token.slice(1, -1), id)}</em>);
    } else {
      // Link: [label](url)
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const label = linkMatch?.[1] ?? token;
      const url = sanitizeUrl(linkMatch?.[2] ?? '');
      nodes.push(
        url ? (
          <a
            key={id}
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-brand underline underline-offset-2 hover:text-brand-fg"
          >
            {label}
          </a>
        ) : (
          token
        ),
      );
    }
    cursor = match.index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

/** Render inline text that may contain soft line breaks. */
function renderMultiline(text: string, keyBase: string): ReactNode[] {
  return text.split('\n').flatMap((line, index) => {
    const parsed = parseInline(line, `${keyBase}-l${index}`);
    return index === 0 ? parsed : [<br key={`${keyBase}-br${index}`} />, ...parsed];
  });
}

/** Convert markdown source into safe React nodes. */
export function renderMarkdown(source: string): ReactNode {
  const blocks = parseBlocks(source);

  return blocks.map((block, index) => {
    const key = `b${index}`;
    switch (block.type) {
      case 'heading': {
        const headingClass = {
          1: 'text-base font-semibold',
          2: 'text-sm font-semibold',
          3: 'text-sm font-medium',
        } as const;
        const Tag = ({ 1: 'h1', 2: 'h2', 3: 'h3' } as const)[block.level];
        return (
          <Tag key={key} className={headingClass[block.level]}>
            {parseInline(block.text, key)}
          </Tag>
        );
      }
      case 'code':
        return (
          <pre
            key={key}
            className="overflow-x-auto rounded-card bg-black/5 p-3 font-mono text-xs dark:bg-white/10"
          >
            <code>{block.code}</code>
          </pre>
        );
      case 'quote':
        return (
          <blockquote
            key={key}
            className="border-l-2 border-brand/40 pl-3 italic text-slate-600 dark:text-slate-300"
          >
            {renderMultiline(block.text, key)}
          </blockquote>
        );
      case 'ul':
        return (
          <ul key={key} className="list-disc space-y-1 pl-5">
            {block.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`}>{parseInline(item, `${key}-${itemIndex}`)}</li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol key={key} className="list-decimal space-y-1 pl-5">
            {block.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`}>{parseInline(item, `${key}-${itemIndex}`)}</li>
            ))}
          </ol>
        );
      default:
        return (
          <p key={key} className="leading-relaxed">
            {renderMultiline(block.text, key)}
          </p>
        );
    }
  });
}
