/** High-level orchestration — port of app/core/compare.py. */

import type { NormalizationSettings } from './config';
import { DEFAULT_SETTINGS } from './config';
import { buildPipeline, runPipeline } from './normalize';
import { buildDiffEntries, summarize, tagFormatOnly, unifiedDiff } from './diff';
import type { ComparisonResult, NormalizedDocument } from './schemas';

export function createNormalizedDocument(name: string, content: string): NormalizedDocument {
  return { name, originalText: content, normalizedText: content, stepsApplied: [] };
}

export function compareDocuments(
  docA: NormalizedDocument,
  docB: NormalizedDocument,
  settings: NormalizationSettings = DEFAULT_SETTINGS,
  contextLines = 3,
): ComparisonResult {
  const pipeline = buildPipeline(settings);
  const start = performance.now();
  const normalizedA = runPipeline(docA, pipeline);
  const normalizedB = runPipeline(docB, pipeline);

  const entries = buildDiffEntries(normalizedA, normalizedB);
  const classified = tagFormatOnly(entries);
  const summary = summarize(classified);
  summary.durationMs = Math.round(performance.now() - start);

  return {
    documentA: normalizedA,
    documentB: normalizedB,
    diffEntries: classified,
    diffSummary: summary,
    unifiedDiff: unifiedDiff(normalizedA, normalizedB, contextLines),
  };
}
