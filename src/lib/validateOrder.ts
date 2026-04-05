import type { Vector, Matrix } from '../types';
import { vectorLte, vectorAdd } from './matrixUtils';

export interface OrderValidationStep {
  processIndex: number;
  need: Vector;
  work: Vector;
  satisfied: boolean;
  newWork: Vector;
}

export interface OrderValidationResult {
  valid: boolean;
  steps: OrderValidationStep[];
  failedAt?: number;
  reason?: string;
}

export function validateCustomOrder(
  order: number[],
  available: Vector,
  allocation: Matrix,
  need: Matrix,
  n: number,
): OrderValidationResult {
  if (order.length !== n) {
    return {
      valid: false, steps: [],
      reason: `Cần đúng ${n} tiến trình, nhưng nhận ${order.length}`,
    };
  }

  const seen = new Set<number>();
  for (const p of order) {
    if (p < 0 || p >= n) {
      return { valid: false, steps: [], reason: `P${p} không tồn tại (n = ${n})` };
    }
    if (seen.has(p)) {
      return { valid: false, steps: [], reason: `P${p} xuất hiện nhiều hơn một lần` };
    }
    seen.add(p);
  }

  let work = [...available];
  const steps: OrderValidationStep[] = [];

  for (const p of order) {
    const satisfied = vectorLte(need[p], work);
    const newWork = satisfied ? vectorAdd(work, allocation[p]) : [...work];
    steps.push({ processIndex: p, need: [...need[p]], work: [...work], satisfied, newWork });
    if (!satisfied) {
      return { valid: false, steps, failedAt: p };
    }
    work = newWork;
  }

  return { valid: true, steps };
}

/** Parse "0 2 1" or "P0 P2 P1" → [0, 2, 1] */
export function parseOrderText(text: string): number[] {
  return (text.match(/\d+/g) ?? []).map(Number);
}
