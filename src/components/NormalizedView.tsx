import type { NormalizedDocument } from '../lib';

function Pane({ doc }: { doc: NormalizedDocument }) {
  const applied = doc.stepsApplied.filter((s) => s.changesDetected);
  return (
    <div>
      <h3>{doc.name}</h3>
      <pre>{doc.normalizedText || '(empty)'}</pre>
      <p className="steps">
        {applied.length
          ? `Steps that changed the text: ${applied.map((s) => s.name).join(', ')}`
          : 'No normalization step changed this document.'}
      </p>
    </div>
  );
}

export function NormalizedView({
  documentA,
  documentB,
}: {
  documentA: NormalizedDocument;
  documentB: NormalizedDocument;
}) {
  return (
    <div className="normalized">
      <Pane doc={documentA} />
      <Pane doc={documentB} />
    </div>
  );
}
