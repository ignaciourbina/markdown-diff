/** Normalization settings — port of app/config.py + config/default_config.json. */

export type DiffGranularity = 'line' | 'word';

export interface NormalizationSettings {
  convertTabs: boolean;
  tabWidth: number;
  stripTrailingWhitespace: boolean;
  collapseBlankLines: boolean;
  normalizeHeadings: boolean;
  normalizeLists: boolean;
  normalizePunctuation: boolean;
  diffGranularity: DiffGranularity;
}

export const MAX_DOCUMENT_SIZE_BYTES = 2_097_152; // 2 MB

export const DEFAULT_SETTINGS: NormalizationSettings = {
  convertTabs: true,
  tabWidth: 4,
  stripTrailingWhitespace: true,
  collapseBlankLines: true,
  normalizeHeadings: true,
  normalizeLists: true,
  normalizePunctuation: true,
  diffGranularity: 'line',
};

export function validateSettings(s: NormalizationSettings): void {
  if (s.tabWidth < 1 || s.tabWidth > 8) {
    throw new Error(`tabWidth must be between 1 and 8, got ${s.tabWidth}`);
  }
}
