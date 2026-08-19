/** Token-level diff — port of app/core/tokens.py. */

import { SequenceMatcher } from './sequencematcher';

export type TokenTag = 'equal' | 'insert' | 'delete';
export type TokenSegment = [string, TokenTag];

const TOKEN_PATTERN = /\s+|\S+/gu;

export function tokenize(text: string): string[] {
  return text.match(TOKEN_PATTERN) ?? [];
}

export function diffTokens(before: string, after: string): [TokenSegment[], TokenSegment[]] {
  const tokensBefore = tokenize(before);
  const tokensAfter = tokenize(after);
  const matcher = new SequenceMatcher(tokensBefore, tokensAfter);

  const beforeSegments: TokenSegment[] = [];
  const afterSegments: TokenSegment[] = [];
  for (const [tag, i1, i2, j1, j2] of matcher.getOpcodes()) {
    if (tag === 'equal') {
      for (const t of tokensBefore.slice(i1, i2)) beforeSegments.push([t, 'equal']);
      for (const t of tokensAfter.slice(j1, j2)) afterSegments.push([t, 'equal']);
    } else if (tag === 'delete') {
      for (const t of tokensBefore.slice(i1, i2)) beforeSegments.push([t, 'delete']);
    } else if (tag === 'insert') {
      for (const t of tokensAfter.slice(j1, j2)) afterSegments.push([t, 'insert']);
    } else {
      for (const t of tokensBefore.slice(i1, i2)) beforeSegments.push([t, 'delete']);
      for (const t of tokensAfter.slice(j1, j2)) afterSegments.push([t, 'insert']);
    }
  }
  return [beforeSegments, afterSegments];
}
