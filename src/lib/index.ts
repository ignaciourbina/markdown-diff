export { compareDocuments, createNormalizedDocument } from './compare';
export { buildPipeline, runPipeline } from './normalize';
export { buildDiffEntries, classifyTag, summarize, tagFormatOnly, unifiedDiff } from './diff';
export { diffTokens, tokenize } from './tokens';
export { buildNavigationIndex, getNext, getPrevious } from './navigation';
export { exportMarkdown } from './report';
export { DEFAULT_SETTINGS, MAX_DOCUMENT_SIZE_BYTES, validateSettings } from './config';
export type { NormalizationSettings } from './config';
export type * from './schemas';
