import { useMemo, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  MAX_DOCUMENT_SIZE_BYTES,
  compareDocuments,
  createNormalizedDocument,
  exportMarkdown,
} from './lib';
import type { ComparisonResult, NormalizationSettings } from './lib';
import { DocumentPane } from './components/DocumentPane';
import { OptionsPanel } from './components/OptionsPanel';
import { SummaryBar } from './components/SummaryBar';
import { UnifiedDiffView } from './components/UnifiedDiffView';
import { EntryNavigator } from './components/EntryNavigator';
import { NormalizedView } from './components/NormalizedView';

type Tab = 'unified' | 'navigation' | 'normalized';

export default function App() {
  const [nameA, setNameA] = useState('Document A');
  const [nameB, setNameB] = useState('Document B');
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [settings, setSettings] = useState<NormalizationSettings>(DEFAULT_SETTINGS);
  const [contextLines, setContextLines] = useState(3);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('unified');

  const canCompare = useMemo(() => textA.trim() !== '' || textB.trim() !== '', [textA, textB]);

  const runComparison = () => {
    setError(null);
    for (const [label, text] of [
      [nameA, textA],
      [nameB, textB],
    ] as const) {
      if (new TextEncoder().encode(text).length > MAX_DOCUMENT_SIZE_BYTES) {
        setError(`${label} exceeds the 2 MB limit.`);
        return;
      }
    }
    try {
      setResult(
        compareDocuments(
          createNormalizedDocument(nameA, textA),
          createNormalizedDocument(nameB, textB),
          settings,
          contextLines,
        ),
      );
      setTab('unified');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const blob = new Blob([exportMarkdown(result.diffEntries)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comparison-report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header>
        <h1>Markdown Diff</h1>
        <p>
          Compare two Markdown documents. Both are normalized first, so formatting noise does not
          read as change.
        </p>
      </header>

      <div className="inputs">
        <DocumentPane
          label="Document A"
          name={nameA}
          text={textA}
          onName={setNameA}
          onText={setTextA}
        />
        <DocumentPane
          label="Document B"
          name={nameB}
          text={textB}
          onName={setNameB}
          onText={setTextB}
        />
      </div>

      <OptionsPanel
        settings={settings}
        contextLines={contextLines}
        onSettings={setSettings}
        onContextLines={setContextLines}
      />

      <div className="actions">
        <button className="primary" onClick={runComparison} disabled={!canCompare}>
          Normalize &amp; Compare
        </button>
        {result && result.diffEntries.length > 0 && (
          <button className="secondary" onClick={downloadReport}>
            Download report
          </button>
        )}
        {error && <span className="error">{error}</span>}
      </div>

      {result && (
        <section>
          <SummaryBar summary={result.diffSummary} />
          <div className="tabs" role="tablist">
            <button className={tab === 'unified' ? 'active' : ''} onClick={() => setTab('unified')}>
              Unified diff
            </button>
            <button
              className={tab === 'navigation' ? 'active' : ''}
              onClick={() => setTab('navigation')}
            >
              Changes ({result.diffEntries.length})
            </button>
            <button
              className={tab === 'normalized' ? 'active' : ''}
              onClick={() => setTab('normalized')}
            >
              Normalized documents
            </button>
          </div>
          {tab === 'unified' && <UnifiedDiffView diff={result.unifiedDiff} />}
          {tab === 'navigation' && <EntryNavigator entries={result.diffEntries} />}
          {tab === 'normalized' && (
            <NormalizedView documentA={result.documentA} documentB={result.documentB} />
          )}
        </section>
      )}

      <footer>
        Runs entirely in the browser; documents are not uploaded anywhere.{' '}
        <a href="https://github.com/ignaciourbina/markdown-diff">Source on GitHub</a>.
      </footer>
    </div>
  );
}
