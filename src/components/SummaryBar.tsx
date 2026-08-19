import type { DiffSummary } from '../lib';

export function SummaryBar({ summary }: { summary: DiffSummary }) {
  const stats: Array<[string, number]> = [
    ['Differences', summary.totalDifferences],
    ['Additions', summary.additions],
    ['Deletions', summary.deletions],
    ['Modifications', summary.modifications],
    ['Format-only', summary.formatOnly],
  ];
  return (
    <div className="summary">
      {stats.map(([label, value]) => (
        <span className="stat" key={label}>
          <b>{value}</b> {label}
        </span>
      ))}
      {summary.durationMs !== null && (
        <span className="stat">
          <b>{summary.durationMs}</b> ms
        </span>
      )}
    </div>
  );
}
