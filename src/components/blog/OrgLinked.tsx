import { Fragment } from 'react';
import { ORG_LINKS } from '@/content/blog';

const names = Object.keys(ORG_LINKS);
const pattern = new RegExp(`(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');

/**
 * Text in which every organisation named in ORG_LINKS opens its own site, in a
 * new tab: "Co-Founder and Design Director, ZeeFrames" links ZeeFrames.
 * The link keeps the surrounding text's colour and is told apart by its underline.
 */
export function OrgLinked({ text }: { text: string }) {
  return (
    <>
      {text.split(pattern).map((part, i) =>
        part in ORG_LINKS ? (
          <a
            key={i}
            href={ORG_LINKS[part]}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px', textDecorationThickness: '1px' }}
          >
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
