import { describe, expect, it } from 'vitest';
import { exportMarkdown } from '../report';
import type { DiffEntry } from '../schemas';

const entry: DiffEntry = {
  id: 'abc123def456',
  diffType: 'modification',
  heading: 'Intro',
  lineNumber: 4,
  contentBefore: 'old line',
  contentAfter: 'new line',
  inlineDiff: null,
};

describe('exportMarkdown', () => {
  it('renders entries as a diff report', () => {
    const report = exportMarkdown([entry]);
    expect(report).toContain('# Markdown Comparison Report');
    expect(report).toContain('## Diff abc123def456');
    expect(report).toContain('- Type: modification');
    expect(report).toContain('- Heading: Intro');
    expect(report).toContain('- old line');
    expect(report).toContain('+ new line');
  });

  it('handles no entries', () => {
    expect(exportMarkdown([])).toContain('# Markdown Comparison Report');
  });
});
