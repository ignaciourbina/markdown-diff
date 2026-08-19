/** Normalization pipeline — port of app/core/normalize.py. */

import type { NormalizationSettings } from './config';
import { DEFAULT_SETTINGS } from './config';
import type { NormalizationStep, NormalizedDocument } from './schemas';
import { expandtabs, rstrip, splitlines } from './pystr';

export type PipelineStep = (doc: NormalizedDocument) => [NormalizedDocument, NormalizationStep];

const BLANK_LINES_PATTERN = /\n{3,}/g;
const HEADING_PATTERN = /^(#+)(\s*)(.*)$/gm;
const LIST_PATTERN = /^([ \t]*)([-*+]|\d+\.)[ \t]*(.*)$/gm;
const PUNCT_SPACE_BEFORE = / +([.,;:!?])/g;
const PUNCT_SPACE_AFTER = /([.,;:!?]) {2,}/g;
const MULTIPLE_SPACES = / {2,}/g;

function step(
  name: string,
  description: string,
  transform: (text: string) => string,
): PipelineStep {
  return (doc) => {
    const converted = transform(doc.normalizedText);
    const changed = converted !== doc.normalizedText;
    return [
      { ...doc, normalizedText: converted },
      { name, description, changesDetected: changed },
    ];
  };
}

const normalizeLineEndings = step(
  'normalize_line_endings',
  'Standardized line endings to LF',
  (text) => text.replaceAll('\r\n', '\n').replaceAll('\r', '\n'),
);

const convertTabs = (tabWidth: number) =>
  step('convert_tabs', `Converted tabs to ${tabWidth} spaces`, (text) =>
    expandtabs(text, tabWidth),
  );

const stripTrailingWhitespace = step(
  'strip_trailing_whitespace',
  'Removed trailing whitespace',
  (text) => splitlines(text).map(rstrip).join('\n'),
);

const collapseBlankLines = step(
  'collapse_blank_lines',
  'Collapsed multiple blank lines',
  (text) => text.replace(BLANK_LINES_PATTERN, '\n\n'),
);

const normalizeHeadings = step(
  'normalize_headings',
  'Normalized Markdown headings',
  (text) =>
    text.replace(HEADING_PATTERN, (_m, hashes: string, _sp: string, title: string) => {
      const spacing = title ? ' ' : '';
      return `${hashes}${spacing}${title.trim()}`;
    }),
);

const normalizeLists = (tabWidth: number) =>
  step('normalize_lists', 'Standardized list indentation', (text) =>
    text.replace(LIST_PATTERN, (_m, indent: string, bullet: string, content: string) => {
      const indentSpaces = ' '.repeat(expandtabs(indent, tabWidth).length);
      return `${indentSpaces}${bullet} ${content.trim()}`;
    }),
  );

const normalizePunctuation = step(
  'normalize_punctuation',
  'Standardized punctuation spacing',
  (text) =>
    splitlines(text)
      .map((line) =>
        line
          .replace(PUNCT_SPACE_BEFORE, '$1')
          .replace(PUNCT_SPACE_AFTER, '$1 ')
          .replace(MULTIPLE_SPACES, ' '),
      )
      .join('\n'),
);

export function buildPipeline(settings: NormalizationSettings = DEFAULT_SETTINGS): PipelineStep[] {
  const steps: PipelineStep[] = [normalizeLineEndings];
  if (settings.convertTabs) steps.push(convertTabs(settings.tabWidth));
  if (settings.stripTrailingWhitespace) steps.push(stripTrailingWhitespace);
  if (settings.collapseBlankLines) steps.push(collapseBlankLines);
  if (settings.normalizeHeadings) steps.push(normalizeHeadings);
  if (settings.normalizeLists) steps.push(normalizeLists(settings.tabWidth));
  if (settings.normalizePunctuation) steps.push(normalizePunctuation);
  return steps;
}

export function runPipeline(
  document: NormalizedDocument,
  steps: Iterable<PipelineStep>,
): NormalizedDocument {
  let updated = document;
  const applied: NormalizationStep[] = [];
  for (const s of steps) {
    const [doc, metadata] = s(updated);
    updated = doc;
    applied.push(metadata);
  }
  return { ...updated, stepsApplied: applied };
}
