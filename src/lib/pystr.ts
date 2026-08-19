/** Small helpers matching the Python string semantics the engine relies on. */

/**
 * str.splitlines() — after line-ending normalization only \n remains, so
 * this only needs the trailing-newline rule: a final \n does not produce
 * a trailing empty element ("a\n".splitlines() === ["a"]).
 */
export function splitlines(text: string): string[] {
  if (text === '') return [];
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

/** str.expandtabs(tabsize) — tab stops, not naive replacement. */
export function expandtabs(text: string, tabWidth: number): string {
  let out = '';
  let col = 0;
  for (const ch of text) {
    if (ch === '\t') {
      const pad = tabWidth > 0 ? tabWidth - (col % tabWidth) : 0;
      out += ' '.repeat(pad);
      col += pad;
    } else if (ch === '\n' || ch === '\r') {
      out += ch;
      col = 0;
    } else {
      out += ch;
      col += 1;
    }
  }
  return out;
}

/** str.rstrip() — strips all trailing whitespace. */
export function rstrip(line: string): string {
  return line.replace(/[\s ]+$/u, '');
}
