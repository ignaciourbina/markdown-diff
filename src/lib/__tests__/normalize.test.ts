import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../config';
import { buildPipeline, runPipeline } from '../normalize';
import { createNormalizedDocument } from '../compare';
import { splitlines } from '../pystr';

const run = (text: string, settings = DEFAULT_SETTINGS) =>
  runPipeline(createNormalizedDocument('doc.md', text), buildPipeline(settings));

describe('normalization pipeline', () => {
  it('applies the default normalization rules', () => {
    const result = run('Heading\r\n\r\n\t* Item one   \r\n\r\n\r\n*   Item two');
    expect(result.normalizedText).not.toContain('\r');
    expect(result.normalizedText).not.toContain('\t');
    expect(result.normalizedText).not.toContain('\n\n\n');
    expect(result.normalizedText.endsWith('Item two')).toBe(true);
    for (const line of splitlines(result.normalizedText)) {
      expect(line.endsWith(' ')).toBe(false);
    }
    expect(result.stepsApplied.some((s) => s.changesDetected)).toBe(true);
  });

  it('normalize_lists respects tab width', () => {
    const base = {
      ...DEFAULT_SETTINGS,
      convertTabs: false,
      stripTrailingWhitespace: false,
      collapseBlankLines: false,
      normalizeHeadings: false,
      normalizePunctuation: false,
    };
    const tw2 = run('\t- Indented item', { ...base, tabWidth: 2 });
    const tw4 = run('\t- Indented item', { ...base, tabWidth: 4 });
    expect(tw2.normalizedText).toContain('  - Indented item');
    expect(tw4.normalizedText).toContain('    - Indented item');
    expect(tw2.normalizedText).not.toBe(tw4.normalizedText);
  });

  it('punctuation normalization preserves newlines', () => {
    const result = run('Sentence one.\n\nSentence two,  with extra spaces!');
    expect(result.normalizedText.split('\n\n').length - 1).toBe(1);
  });

  it('empty string does not crash', () => {
    const result = run('');
    expect(result.normalizedText).toBe('');
    expect(result.stepsApplied.length).toBeGreaterThan(0);
  });

  it('handles CJK and emoji', () => {
    const result = run('# 标题\n你好世界 🌍\n日本語テスト\n- 列表项 🎉');
    for (const s of ['标题', '🌍', '日本語テスト', '🎉']) {
      expect(result.normalizedText).toContain(s);
    }
  });
});
