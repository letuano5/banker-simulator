import type { Vector, Matrix, SimulationStep, SimulationResult } from '../types';
import {
  cloneVector,
  vectorLte,
  vectorAdd,
  isZeroVector,
  formatVector,
} from './matrixUtils';

export function runDeadlockDetection(
  available: Vector,
  allocation: Matrix,
  request: Matrix,
  n: number,
  _m: number
): SimulationResult {
  const steps: SimulationStep[] = [];
  let work = cloneVector(available);
  // Finish[i] = true nếu Allocation[i] == 0, ngược lại false
  const finish = Array.from({ length: n }, (_, i) => isZeroVector(allocation[i]));
  const safeSequence: number[] = [];

  const initDesc = Array.from({ length: n }, (_, i) =>
    `  Finish[${i}] = ${finish[i] ? 'true (Allocation[' + i + '] = 0)' : 'false'}`
  ).join('\n');

  steps.push({
    type: 'init',
    work: cloneVector(work),
    finish: [...finish],
    description: `Khởi tạo:\n  Work = Available = ${formatVector(work)}\n${initDesc}`,
    safeSequence: [],
  });

  let changed = true;
  let iteration = 0;

  while (changed) {
    changed = false;
    iteration++;

    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;

      const requestI = request[i];
      const satisfied = vectorLte(requestI, work);

      steps.push({
        type: 'check',
        processIndex: i,
        work: cloneVector(work),
        finish: [...finish],
        description: `Vòng ${iteration}: Kiểm tra P${i}\n  Finish[${i}] = false ✓\n  Request[${i}] = ${formatVector(requestI)}\n  Work = ${formatVector(work)}\n  Request[${i}] ≤ Work? ${satisfied ? '✓ Có' : '✗ Không'}`,
        comparison: {
          label: `Request[P${i}]`,
          lhs: [...requestI],
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
          description: `  → P${i} có thể hoàn thành\n  Work = Work + Allocation[${i}] = ${formatVector(work)}\n  Finish[${i}] = true`,
          safeSequence: [...safeSequence],
        });
      } else {
        steps.push({
          type: 'skip',
          processIndex: i,
          work: cloneVector(work),
          finish: [...finish],
          description: `  → Bỏ qua P${i} (Request[${i}] > Work)`,
          safeSequence: [...safeSequence],
        });
      }
    }
  }

  const deadlockedProcesses = finish
    .map((f, i) => (!f ? i : -1))
    .filter((i) => i !== -1);
  const isDeadlockFree = deadlockedProcesses.length === 0;

  steps.push({
    type: 'result',
    work: cloneVector(work),
    finish: [...finish],
    description: isDeadlockFree
      ? `✅ Không có bế tắc! Tất cả tiến trình đều có thể hoàn thành.\nThứ tự hoàn thành: ${safeSequence.map((i) => `P${i}`).join(' → ')}`
      : `🔴 PHÁT HIỆN BẾ TẮC!\nCác tiến trình bị bế tắc: ${deadlockedProcesses.map((i) => `P${i}`).join(', ')}\nFinish = [${finish.map((f) => f).join(', ')}]`,
    safeSequence: [...safeSequence],
    isSafe: isDeadlockFree,
    deadlockedProcesses,
  });

  return {
    steps,
    isSafe: isDeadlockFree,
    safeSequence: isDeadlockFree ? safeSequence : undefined,
    deadlockedProcesses: isDeadlockFree ? [] : deadlockedProcesses,
  };
}
