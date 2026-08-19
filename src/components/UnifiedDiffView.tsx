export function UnifiedDiffView({ diff }: { diff: string }) {
  if (!diff) return <p>The documents are identical after normalization.</p>;
  const classFor = (line: string): string => {
    if (line.startsWith('---') || line.startsWith('+++')) return 'dline file';
    if (line.startsWith('@@')) return 'dline hunk';
    if (line.startsWith('+')) return 'dline add';
    if (line.startsWith('-')) return 'dline del';
    return 'dline';
  };
  return (
    <pre className="diffview">
      {diff.split('\n').map((line, i) => (
        <span key={i} className={classFor(line)}>
          {line || ' '}
        </span>
      ))}
    </pre>
  );
}
