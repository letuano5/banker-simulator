import type { Matrix, Vector, ImportFormat, Cell } from '../types';

function matrixToLines(matrix: Cell[][]): string {
  return matrix.map((row) => row.map((v) => v ?? 0).join(' ')).join('\n');
}

function vectorToLine(vec: Cell[]): string {
  return vec.map((v) => v ?? 0).join(' ');
}

export function exportBankerFile(
  n: number, m: number,
  available: Cell[], max: Cell[][], allocation: Cell[][]
): string {
  return [
    `${n} ${m}`,
    `# Available`,
    vectorToLine(available),
    `# Max`,
    matrixToLines(max),
    `# Allocation`,
    matrixToLines(allocation),
  ].join('\n');
}

export function exportDeadlockFile(
  n: number, m: number,
  available: Cell[], allocation: Cell[][], request: Cell[][]
): string {
  return [
    `${n} ${m}`,
    `# Available`,
    vectorToLine(available),
    `# Allocation`,
    matrixToLines(allocation),
    `# Request`,
    matrixToLines(request),
  ].join('\n');
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface BankerImportResult {
  n: number; m: number;
  available: Vector; max: Matrix; allocation: Matrix; need: Matrix;
}

interface DeadlockImportResult {
  n: number; m: number;
  available: Vector; allocation: Matrix; request: Matrix;
}

function parseLines(text: string): number[][] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.split(/\s+/).map(Number));
}

function parseMatrix(lines: number[][], startRow: number, rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, (_, i) => {
    const row = lines[startRow + i];
    return Array.from({ length: cols }, (_, j) => row?.[j] ?? 0);
  });
}

export function parseBankerFile(text: string, format: ImportFormat): BankerImportResult {
  const lines = parseLines(text);
  if (lines.length < 1) throw new Error('File rỗng hoặc không hợp lệ');

  const [n, m] = lines[0];
  if (!n || !m) throw new Error('Dòng đầu phải có dạng: n m');

  const available: Vector = Array.from({ length: m }, (_, j) => lines[1]?.[j] ?? 0);
  let max = parseMatrix(lines, 2, n, m);

  let allocation: Matrix;
  let need: Matrix;

  if (format === 'max-allocation') {
    allocation = parseMatrix(lines, 2 + n, n, m);
    need = Array.from({ length: n }, (_, i) =>
      Array.from({ length: m }, (_, j) => Math.max(0, max[i][j] - allocation[i][j]))
    );
  } else {
    // need-allocation: line 1=available, lines 2..n+1=need, lines n+2..2n+1=allocation, max=need+allocation
    need = parseMatrix(lines, 2, n, m);
    allocation = parseMatrix(lines, 2 + n, n, m);
    max = Array.from({ length: n }, (_, i) =>
      Array.from({ length: m }, (_, j) => need[i][j] + allocation[i][j])
    );
  }

  return { n, m, available, max, allocation, need };
}

export function parseDeadlockFile(text: string): DeadlockImportResult {
  const lines = parseLines(text);
  if (lines.length < 1) throw new Error('File rỗng hoặc không hợp lệ');

  const [n, m] = lines[0];
  if (!n || !m) throw new Error('Dòng đầu phải có dạng: n m');

  const available: Vector = Array.from({ length: m }, (_, j) => lines[1]?.[j] ?? 0);
  const allocation = parseMatrix(lines, 2, n, m);
  const request = parseMatrix(lines, 2 + n, n, m);

  return { n, m, available, allocation, request };
}
