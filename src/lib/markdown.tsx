import type { ReactNode } from 'react';

/**
 * A deliberately small Markdown renderer for the blog. It covers what the posts
 * use — headings, paragraphs, quotes, lists, tables, rules and inline bold,
 * italic, code and links — and builds React elements, so no HTML string is ever
 * injected. Anything it does not recognise is rendered as plain text.
 */

/** Heading text to a URL fragment, so sections can be linked to. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={key}>{inline(tok.slice(2, -2), key)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('[')) {
      const close = tok.indexOf('](');
      const label = tok.slice(1, close);
      const href = tok.slice(close + 2, -1);
      const external = /^https?:\/\//.test(href) && !href.includes('procurveux.com');
      out.push(
        <a key={key} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {inline(label, key)}
        </a>,
      );
    } else out.push(<em key={key}>{inline(tok.slice(1, -1), key)}</em>);
    last = idx + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  const key = () => `b${k++}`;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const heading = /^(#{2,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const id = slugify(text);
      const content = inline(text, id);
      blocks.push(
        level === 2 ? (
          <h2 key={key()} id={id}>{content}</h2>
        ) : level === 3 ? (
          <h3 key={key()} id={id}>{content}</h3>
        ) : (
          <h4 key={key()} id={id}>{content}</h4>
        ),
      );
      i++;
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      blocks.push(<hr key={key()} />);
      i++;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buf.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const k2 = key();
      blocks.push(<blockquote key={k2}><p>{inline(buf.join(' '), k2)}</p></blockquote>);
      continue;
    }

    if (trimmed.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      const [head, , ...body] = rows;
      const k2 = key();
      blocks.push(
        <div key={k2} className="post-table">
          <table>
            <thead>
              <tr>{head.map((c, j) => <th key={j} scope="col">{inline(c, `${k2}h${j}`)}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c, `${k2}r${ri}c${j}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const ordered = /^\d+\.\s/.test(trimmed);
    if (ordered || /^[-*]\s/.test(trimmed)) {
      const items: string[] = [];
      const re = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      while (i < lines.length && re.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(re, ''));
        i++;
      }
      const k2 = key();
      const lis = items.map((it, j) => <li key={j}>{inline(it, `${k2}-${j}`)}</li>);
      blocks.push(ordered ? <ol key={k2}>{lis}</ol> : <ul key={k2}>{lis}</ul>);
      continue;
    }

    const buf: string[] = [];
    while (i < lines.length) {
      const l = lines[i].trim();
      if (!l || /^(#{2,4}\s|>|\||-{3,}$|\d+\.\s|[-*]\s)/.test(l)) break;
      buf.push(l);
      i++;
    }
    const k2 = key();
    blocks.push(<p key={k2}>{inline(buf.join(' '), k2)}</p>);
  }

  return <>{blocks}</>;
}
