/**
 * Faithful TypeScript port of Python's difflib.SequenceMatcher
 * (Ratcliff-Obershelp with the b2j junk heuristics), restricted to what
 * this app uses: getOpcodes() with autojunk disabled.
 *
 * Ported so the diff output matches the original Python tool exactly;
 * the popular Myers-diff npm packages produce different (equally valid)
 * opcode sequences, which would have invalidated the ported test suite.
 */

export type OpcodeTag = 'equal' | 'insert' | 'delete' | 'replace';
export type Opcode = [OpcodeTag, number, number, number, number];

interface Match {
  a: number;
  b: number;
  size: number;
}

export class SequenceMatcher<T extends string = string> {
  private a: readonly T[] = [];
  private b: readonly T[] = [];
  private b2j = new Map<T, number[]>();
  private opcodes: Opcode[] | null = null;
  private matchingBlocks: Match[] | null = null;

  constructor(a: readonly T[], b: readonly T[]) {
    this.setSeqs(a, b);
  }

  private setSeqs(a: readonly T[], b: readonly T[]): void {
    this.a = a;
    this.b = b;
    this.b2j = new Map();
    // autojunk=False and no isjunk: every element of b is indexed.
    b.forEach((elt, i) => {
      const indices = this.b2j.get(elt);
      if (indices) indices.push(i);
      else this.b2j.set(elt, [i]);
    });
  }

  /** Port of find_longest_match (no junk handling — none is configured). */
  private findLongestMatch(alo: number, ahi: number, blo: number, bhi: number): Match {
    const { a, b2j } = this;
    let besti = alo;
    let bestj = blo;
    let bestsize = 0;
    let j2len = new Map<number, number>();

    for (let i = alo; i < ahi; i++) {
      const newj2len = new Map<number, number>();
      const indices = b2j.get(a[i]) ?? [];
      for (const j of indices) {
        if (j < blo) continue;
        if (j >= bhi) break;
        const k = (j2len.get(j - 1) ?? 0) + 1;
        newj2len.set(j, k);
        if (k > bestsize) {
          besti = i - k + 1;
          bestj = j - k + 1;
          bestsize = k;
        }
      }
      j2len = newj2len;
    }

    // Extend the match in both directions (the non-junk extension step).
    while (
      besti > alo &&
      bestj > blo &&
      this.a[besti - 1] === this.b[bestj - 1]
    ) {
      besti--;
      bestj--;
      bestsize++;
    }
    while (
      besti + bestsize < ahi &&
      bestj + bestsize < bhi &&
      this.a[besti + bestsize] === this.b[bestj + bestsize]
    ) {
      bestsize++;
    }

    return { a: besti, b: bestj, size: bestsize };
  }

  getMatchingBlocks(): Match[] {
    if (this.matchingBlocks) return this.matchingBlocks;
    const la = this.a.length;
    const lb = this.b.length;

    const queue: Array<[number, number, number, number]> = [[0, la, 0, lb]];
    const matchingBlocks: Match[] = [];
    while (queue.length) {
      const [alo, ahi, blo, bhi] = queue.pop()!;
      const m = this.findLongestMatch(alo, ahi, blo, bhi);
      if (m.size) {
        matchingBlocks.push(m);
        if (alo < m.a && blo < m.b) queue.push([alo, m.a, blo, m.b]);
        if (m.a + m.size < ahi && m.b + m.size < bhi) {
          queue.push([m.a + m.size, ahi, m.b + m.size, bhi]);
        }
      }
    }
    matchingBlocks.sort((x, y) => x.a - y.a || x.b - y.b);

    // Collapse adjacent blocks (the i1==j1 && i2==j2 merge step).
    let i1 = 0;
    let j1 = 0;
    let k1 = 0;
    const nonAdjacent: Match[] = [];
    for (const { a: i2, b: j2, size: k2 } of matchingBlocks) {
      if (i1 + k1 === i2 && j1 + k1 === j2) {
        k1 += k2;
      } else {
        if (k1) nonAdjacent.push({ a: i1, b: j1, size: k1 });
        i1 = i2;
        j1 = j2;
        k1 = k2;
      }
    }
    if (k1) nonAdjacent.push({ a: i1, b: j1, size: k1 });
    nonAdjacent.push({ a: la, b: lb, size: 0 });

    this.matchingBlocks = nonAdjacent;
    return nonAdjacent;
  }

  getOpcodes(): Opcode[] {
    if (this.opcodes) return this.opcodes;
    let i = 0;
    let j = 0;
    const answer: Opcode[] = [];
    for (const { a: ai, b: bj, size } of this.getMatchingBlocks()) {
      let tag: OpcodeTag | '' = '';
      if (i < ai && j < bj) tag = 'replace';
      else if (i < ai) tag = 'delete';
      else if (j < bj) tag = 'insert';
      if (tag) answer.push([tag, i, ai, j, bj]);
      i = ai + size;
      j = bj + size;
      if (size) answer.push(['equal', ai, i, bj, j]);
    }
    this.opcodes = answer;
    return answer;
  }

  /** Port of get_grouped_opcodes, used by unified diff hunking. */
  getGroupedOpcodes(n = 3): Opcode[][] {
    let codes = this.getOpcodes();
    if (!codes.length) codes = [['equal', 0, 1, 0, 1]];

    if (codes[0][0] === 'equal') {
      const [tag, i1, i2, j1, j2] = codes[0];
      codes[0] = [tag, Math.max(i1, i2 - n), i2, Math.max(j1, j2 - n), j2];
    }
    const last = codes[codes.length - 1];
    if (last[0] === 'equal') {
      const [tag, i1, i2, j1, j2] = last;
      codes[codes.length - 1] = [tag, i1, Math.min(i2, i1 + n), j1, Math.min(j2, j1 + n)];
    }

    const nn = n + n;
    const groups: Opcode[][] = [];
    let group: Opcode[] = [];
    for (let [tag, i1, i2, j1, j2] of codes) {
      if (tag === 'equal' && i2 - i1 > nn) {
        group.push([tag, i1, Math.min(i2, i1 + n), j1, Math.min(j2, j1 + n)]);
        groups.push(group);
        group = [];
        i1 = Math.max(i1, i2 - n);
        j1 = Math.max(j1, j2 - n);
      }
      group.push([tag, i1, i2, j1, j2]);
    }
    if (group.length && !(group.length === 1 && group[0][0] === 'equal')) {
      groups.push(group);
    }
    return groups;
  }
}
