import { useMemo, useState } from 'react';
import { diffTokens } from '../lib';
import type { DiffEntry } from '../lib';
import type { TokenSegment } from '../lib/tokens';

const TYPE_LABEL: Record<DiffEntry['diffType'], string> = {
  addition: 'Addition',
  deletion: 'Deletion',
  modification: 'Modification',
  format_only: 'Format only',
};

function Tokens({ segments }: { segments: TokenSegment[] }) {
  return (
    <div className="content">
      {segments.map(([token, tag], i) =>
        tag === 'equal' ? (
          <span key={i}>{token}</span>
        ) : (
          <span key={i} className={tag === 'delete' ? 'token-delete' : 'token-insert'}>
            {token}
          </span>
        ),
      )}
    </div>
  );
}

export function EntryNavigator({ entries }: { entries: DiffEntry[] }) {
  const [position, setPosition] = useState(0);
  const entry = entries[position];

  const [beforeSegments, afterSegments] = useMemo(
    () => (entry ? diffTokens(entry.contentBefore, entry.contentAfter) : [[], []]),
    [entry],
  );

  if (!entry) return <p>No differences to navigate.</p>;

  return (
    <div>
      <div className="nav-controls">
        <button
          className="secondary"
          onClick={() => setPosition((p) => p - 1)}
          disabled={position === 0}
        >
          Previous
        </button>
        <button
          className="secondary"
          onClick={() => setPosition((p) => p + 1)}
          disabled={position === entries.length - 1}
        >
          Next
        </button>
        <span className="pos">
          {position + 1} of {entries.length}
        </span>
      </div>
      <p className="entry-meta">
        <span className={`badge ${entry.diffType}`}>{TYPE_LABEL[entry.diffType]}</span>
        line {entry.lineNumber}
        {entry.heading && <> · under “{entry.heading}”</>}
        <> · id {entry.id}</>
      </p>
      <div className="token-panes">
        <div className="token-pane">
          <h3>Before</h3>
          {entry.contentBefore ? <Tokens segments={beforeSegments} /> : <em>(no content)</em>}
        </div>
        <div className="token-pane">
          <h3>After</h3>
          {entry.contentAfter ? <Tokens segments={afterSegments} /> : <em>(no content)</em>}
        </div>
      </div>
    </div>
  );
}
