import type { Vector, Matrix, SimulationStep, SimulationResult } from '../types';
import {
  cloneVector,
  vectorLte,
  vectorAdd,
  formatVector,
} from './matrixUtils';

export function runSafetyCheck(
  available: Vector,
  allocation: Matrix,
  need: Matrix,
  n: number,
  _m: number
): SimulationResult {
  const steps: SimulationStep[] = [];
  let work = cloneVector(available);
  const finish = Array(n).fill(false);
  const safeSequence: number[] = [];

  // Step 1: Init
  steps.push({
    type: 'init',
    work: cloneVector(work),
    finish: [...finish],
    description: `Khởi tạo: Work = Available = ${formatVector(work)}\nFinish[i] = false với mọi i = 0..${n - 1}`,
    safeSequence: [],
  });

  // Step 2-3: Loop
  let changed = true;
  let iteration = 0;

  while (changed && safeSequence.length < n) {
    changed = false;
    iteration++;

    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;

      const needI = need[i];
      const satisfied = vectorLte(needI, work);

      steps.push({
        type: 'check',
        processIndex: i,
        work: cloneVector(work),
        finish: [...finish],
        description: `Vòng ${iteration}: Kiểm tra P${i}\n  Finish[${i}] = false ✓\n  Need[${i}] = ${formatVector(needI)}\n  Work = ${formatVector(work)}\n  Need[${i}] ≤ Work? ${satisfied ? '✓ Có' : '✗ Không'}`,
        comparison: {
          label: `Need[P${i}]`,
          lhs: [...needI],
          rhs: cloneVector(work),
          satisfied,
        },
        safeSequence: [...safeSequence],
      });

      if (satisfied) {
        work = vectorAdd(work, allocation[i]);
        finish[i] = true;
        safeSequence.push(i);
        changed = true;

        steps.push({
          type: 'allocate',
          processIndex: i,
          work: cloneVector(work),
          finish: [...finish],
          description: `  → Cấp phát tài nguyên cho P${i}\n  Work = Work + Allocation[${i}] = ${formatVector(work)}\n  Finish[${i}] = true\n  Thêm P${i} vào Safe Sequence`,
          safeSequence: [...safeSequence],
        });
      } else {
        steps.push({
          type: 'skip',
          processIndex: i,
          work: cloneVector(work),
          finish: [...finish],
          description: `  → Bỏ qua P${i} (Need[${i}] > Work)`,
          safeSequence: [...safeSequence],
        });
      }
    }
  }

  const isSafe = finish.every(Boolean);

  steps.push({
    type: 'result',
    work: cloneVector(work),
    finish: [...finish],
    description: isSafe
      ? `✅ Hệ thống ở trạng thái AN TOÀN\nSafe Sequence: ${safeSequence.map((i) => `P${i}`).join(' → ')}`
      : `❌ Hệ thống ở trạng thái KHÔNG AN TOÀN\nCác tiến trình không hoàn thành: ${finish.map((f, i) => (!f ? `P${i}` : null)).filter(Boolean).join(', ')}`,
    safeSequence: [...safeSequence],
    isSafe,
    deadlockedProcesses: isSafe ? [] : finish.map((f, i) => (!f ? i : -1)).filter((i) => i !== -1),
  });

  return {
    steps,
    isSafe,
    safeSequence: isSafe ? safeSequence : undefined,
    deadlockedProcesses: isSafe ? undefined : finish.map((f, i) => (!f ? i : -1)).filter((i) => i !== -1),
  };
}
