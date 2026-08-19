import type { NormalizationSettings } from '../lib';

interface Props {
  settings: NormalizationSettings;
  contextLines: number;
  onSettings: (settings: NormalizationSettings) => void;
  onContextLines: (n: number) => void;
}

const TOGGLES: Array<[keyof NormalizationSettings, string]> = [
  ['convertTabs', 'Convert tabs to spaces'],
  ['stripTrailingWhitespace', 'Strip trailing whitespace'],
  ['collapseBlankLines', 'Collapse blank lines'],
  ['normalizeHeadings', 'Normalize headings'],
  ['normalizeLists', 'Normalize lists'],
  ['normalizePunctuation', 'Normalize punctuation'],
];

export function OptionsPanel({ settings, contextLines, onSettings, onContextLines }: Props) {
  return (
    <div className="options">
      <h2>Normalization</h2>
      <div className="grid">
        {TOGGLES.map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={settings[key] as boolean}
              onChange={(e) => onSettings({ ...settings, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
        <label>
          Tab width
          <input
            type="number"
            min={2}
            max={8}
            value={settings.tabWidth}
            onChange={(e) => onSettings({ ...settings, tabWidth: Number(e.target.value) })}
          />
        </label>
        <label>
          Context lines
          <input
            type="number"
            min={0}
            max={10}
            value={contextLines}
            onChange={(e) => onContextLines(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
