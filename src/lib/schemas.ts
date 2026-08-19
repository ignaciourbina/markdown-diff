/** Shared data structures — port of app/schemas.py. */

export type DiffType = 'addition' | 'deletion' | 'modification' | 'format_only';

export interface NormalizationStep {
  name: string;
  description: string;
  changesDetected: boolean;
}

export interface NormalizedDocument {
  name: string;
  originalText: string;
  normalizedText: string;
  stepsApplied: NormalizationStep[];
}

export interface DiffEntry {
  id: string;
  diffType: DiffType;
  heading: string | null;
  lineNumber: number;
  contentBefore: string;
  contentAfter: string;
  inlineDiff: string | null;
}

export interface DiffSummary {
  totalDifferences: number;
  additions: number;
  deletions: number;
  modifications: number;
  formatOnly: number;
  generatedAt: Date;
  durationMs: number | null;
}

export interface ComparisonResult {
  documentA: NormalizedDocument;
  documentB: NormalizedDocument;
  diffEntries: DiffEntry[];
  diffSummary: DiffSummary;
  unifiedDiff: string;
}
