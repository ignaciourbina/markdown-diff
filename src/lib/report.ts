/** Report generation — port of app/core/report.py. Returns strings; the browser downloads them. */

import { splitlines } from './pystr';
import type { DiffEntry } from './schemas';

export function exportMarkdown(entries: Iterable<DiffEntry>): string {
  const lines: string[] = ['# Markdown Comparison Report', ''];
  for (const entry of entries) {
    lines.push(`## Diff ${entry.id}`);
    lines.push(`- Type: ${entry.diffType}`);
    if (entry.heading) lines.push(`- Heading: ${entry.heading}`);
    lines.push('');
    lines.push('```diff');
    if (entry.contentBefore) for (const l of splitlines(entry.contentBefore)) lines.push(`- ${l}`);
    if (entry.contentAfter) for (const l of splitlines(entry.contentAfter)) lines.push(`+ ${l}`);
    lines.push('```');
    lines.push('');
  }
  return lines.join('\n');
}
