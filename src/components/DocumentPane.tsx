import { useRef } from 'react';

interface Props {
  label: string;
  name: string;
  text: string;
  onName: (name: string) => void;
  onText: (text: string) => void;
}

export function DocumentPane({ label, name, text, onName, onText }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    onName(file.name);
    onText(await file.text());
  };

  return (
    <div className="pane">
      <h2>{label}</h2>
      <input
        ref={fileRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <textarea
        placeholder="Or paste content here"
        value={text}
        onChange={(e) => onText(e.target.value)}
        spellCheck={false}
      />
      <p className="filename">{name}</p>
    </div>
  );
}
