import type { Matrix, Vector, Cell, InputMatrix, InputVector } from '../types';

// ── Constructors ──────────────────────────────────────────────────────────────

export function createMatrix(rows: number, cols: number, fill = 0): Matrix {
  return Array.from({ length: rows }, () => Array(cols).fill(fill));
}

export function createVector(length: number, fill = 0): Vector {
  return Array(length).fill(fill);
}

export function createInputMatrix(rows: number, cols: number): InputMatrix {
  return Array.from({ length: rows }, () => Array<Cell>(cols).fill(0));
}

export function createInputVector(length: number): InputVector {
  return Array<Cell>(length).fill(0);
}

// ── Resize ─────────────────────────────────────────────────────────────────────
// newRows/Cols are filled with null for InputMatrix (blank cells), 0 for Matrix

export function resizeMatrix(matrix: Matrix, newRows: number, newCols: number): Matrix {
  return Array.from({ length: newRows }, (_, i) =>
    Array.from({ length: newCols }, (_, j) => matrix[i]?.[j] ?? 0)
  );
}

export function resizeVector(vector: Vector, newLength: number): Vector {
  return Array.from({ length: newLength }, (_, i) => vector[i] ?? 0);
}

export function resizeInputMatrix(matrix: InputMatrix, newRows: number, newCols: number): InputMatrix {
  return Array.from({ length: newRows }, (_, i) =>
    Array.from({ length: newCols }, (_, j) => (i < matrix.length && j < (matrix[i]?.length ?? 0) ? matrix[i][j] : 0))
  );
}

export function resizeInputVector(vector: InputVector, newLength: number): InputVector {
  return Array.from({ length: newLength }, (_, i) => (i < vector.length ? vector[i] : 0));
}

// ── Validation (UI → algorithm) ───────────────────────────────────────────────

/** Throws a descriptive error if any cell is null, otherwise returns the number[][] */
export function validateInputMatrix(m: InputMatrix, label: string): Matrix {
  for (let i = 0; i < m.length; i++) {
    for (let j = 0; j < (m[i]?.length ?? 0); j++) {
      if (m[i][j] === null) {
        throw new Error(`Ô ${label}[P${i}][R${j}] còn trống`);
      }
    }
  }
  return m as Matrix;
}

export function validateInputVector(v: InputVector, label: string): Vector {
  for (let j = 0; j < v.length; j++) {
    if (v[j] === null) {
      throw new Error(`Ô ${label}[R${j}] còn trống`);
    }
  }
  return v as Vector;
}

// ── Algorithm helpers (operate on strict number arrays) ───────────────────────

export function vectorLte(a: Vector, b: Vector): boolean {
  return a.every((val, j) => val <= b[j]);
}

export function vectorAdd(a: Vector, b: Vector): Vector {
  return a.map((val, j) => val + b[j]);
}

export function vectorSub(a: Vector, b: Vector): Vector {
  return a.map((val, j) => val - b[j]);
}

export function isZeroVector(v: Vector): boolean {
  return v.every((val) => val === 0);
}

export function cloneMatrix(m: Matrix): Matrix {
  return m.map((row) => [...row]);
}

export function cloneVector(v: Vector): Vector {
  return [...v];
}

export function formatVector(v: Vector): string {
  return `[${v.join(', ')}]`;
}

// ── Nullable auto-sync helpers ─────────────────────────────────────────────────

/** Compute Need = Max - Allocation for one cell, returns null if either operand is null */
export function computeNeed(maxVal: Cell, allocVal: Cell): Cell {
  if (maxVal === null || allocVal === null) return null;
  return Math.max(0, maxVal - allocVal);
}

/** Compute Max = Need + Allocation for one cell, returns null if either operand is null */
export function computeMax(needVal: Cell, allocVal: Cell): Cell {
  if (needVal === null || allocVal === null) return null;
  return needVal + allocVal;
}
