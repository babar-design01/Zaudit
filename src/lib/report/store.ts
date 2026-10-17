import type { AuditResult } from '@/lib/audit/types';

/**
 * Where a finished report lives between the run that produced it and the page
 * that reads it back.
 *
 * One server needs nothing more than the map below: the report page asks for
 * `/api/audit/:id` and the same process answers. A serverless host is the
 * reason for the second half of this file — every request can land on a fresh
 * instance, so the map the audit wrote to is usually not the map the report
 * page reads from, and a link sent to a colleague would 404 on arrival.
 *
 * Vercel Blob fills that gap when `BLOB_READ_WRITE_TOKEN` is set: the report is
 * written as one private object, readable only with the token, which is to say
 * only by this app's own server. Without the token nothing changes and nothing
 * breaks — reports are in memory, as they were, and a link only works while the
 * instance that ran the audit is still warm.
 */

const MEMORY_MAX = 40;
const memory = new Map<string, { at: number; result: AuditResult }>();

function blobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function blobPath(id: string): string {
  return `reports/${id}.json`;
}

function keepMemory(id: string, result: AuditResult): void {
  memory.set(id, { at: Date.now(), result });
  if (memory.size > MEMORY_MAX) {
    const oldest = [...memory.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) memory.delete(oldest[0]);
  }
}

/**
 * A report carries its annotation crops as data URLs, so it is megabytes rather
 * than kilobytes. That is well inside what one `put` handles, and it is the
 * reason the write is awaited rather than fired off: the reader clicks through
 * to the report seconds later, and on a serverless host the function may be
 * frozen the moment the response ends.
 */
export async function putReport(result: AuditResult): Promise<void> {
  keepMemory(result.id, result);
  if (!blobEnabled()) return;
  try {
    const { put } = await import('@vercel/blob');
    await put(blobPath(result.id), JSON.stringify(result), {
      access: 'private',
      contentType: 'application/json',
      // The id is the address the report page already knows; a random suffix
      // would make it unfindable.
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (err) {
    // A failed write costs the shareable link, not the report: the reader's own
    // copy still renders. Worth a line in the log, not an error to the reader.
    console.warn('report store: could not write to blob —', err instanceof Error ? err.message : err);
  }
}

export async function getReport(id: string): Promise<AuditResult | null> {
  const hit = memory.get(id);
  if (hit) return hit.result;
  if (!blobEnabled()) return null;
  try {
    const { get } = await import('@vercel/blob');
    const found = await get(blobPath(id), { access: 'private' });
    if (!found || found.statusCode !== 200) return null;
    const result = (await new Response(found.stream).json()) as AuditResult;
    // Reading it back is a round trip to storage; the next reader on this
    // instance should not pay it again.
    keepMemory(id, result);
    return result;
  } catch {
    // Not found, or storage is having a bad day. Either way the route says the
    // same thing: run it again.
    return null;
  }
}
