import type { BankerState, ResourceRequest, SimulationStep, SimulationResult } from '../types';
import {
  cloneVector,
  cloneMatrix,
  vectorLte,
  vectorSub,
  vectorAdd,
  formatVector,
} from './matrixUtils';
import { runSafetyCheck } from './bankerSafety';

export function runResourceRequest(
  state: BankerState,
  req: ResourceRequest
): SimulationResult {
  const { processIndex: i, request } = req;
  const { available, allocation, need, n, m } = state;
  const steps: SimulationStep[] = [];

  const work0 = cloneVector(available);
  const finish0 = Array(n).fill(false);

  steps.push({
    type: 'init',
    work: work0,
    finish: finish0,
    description: `Kiểm tra yêu cầu cấp phát tài nguyên cho P${i}\nRequest[${i}] = ${formatVector(request)}`,
    safeSequence: [],
  });

  // Step 1: Request[i] <= Need[i]?
  const needI = need[i];
  const step1Satisfied = vectorLte(request, needI);

  steps.push({
    type: 'precheck',
    processIndex: i,
    work: work0,
    finish: finish0,
    description: `Bước 1: Kiểm tra Request[${i}] ≤ Need[${i}]\n  Request[${i}] = ${formatVector(request)}\n  Need[${i}] = ${formatVector(needI)}\n  ${step1Satisfied ? '✓ Thỏa mãn → sang bước 2' : '✗ Vi phạm! P' + i + ' yêu cầu vượt quá Max đã khai báo'}`,
    comparison: {
      label: `Request[P${i}]`,
      lhs: [...request],
      rhs: [...needI],
      rhsLabel: `Need[P${i}]`,
      satisfied: step1Satisfied,
    },
    safeSequence: [],
  });

  if (!step1Satisfied) {
    steps.push({
      type: 'error',
      work: work0,
      finish: finish0,
      description: `❌ LỖI: P${i} yêu cầu tài nguyên vượt quá số lượng tối đa đã khai báo!\nRequest[${i}] = ${formatVector(request)} > Need[${i}] = ${formatVector(needI)}`,
      safeSequence: [],
      isSafe: false,
      errorMessage: `P${i} yêu cầu vượt quá Max đã khai báo`,
    });
    return {
      steps,
      isSafe: false,
      errorMessage: `P${i} yêu cầu vượt quá Max đã khai báo`,
    };
  }

  // Step 2: Request[i] <= Available?
  const step2Satisfied = vectorLte(request, available);

  steps.push({
    type: 'precheck',
    processIndex: i,
    work: cloneVector(available),
    finish: finish0,
    description: `Bước 2: Kiểm tra Request[${i}] ≤ Available\n  Request[${i}] = ${formatVector(request)}\n  Available = ${formatVector(available)}\n  ${step2Satisfied ? '✓ Thỏa mãn → sang bước 3 (thử cấp phát)' : '✗ Không đủ tài nguyên! P' + i + ' phải chờ'}`,
    comparison: {
      label: `Request[P${i}]`,
      lhs: [...request],
      rhs: cloneVector(available),
      rhsLabel: 'Available',
      satisfied: step2Satisfied,
    },
    safeSequence: [],
  });

  if (!step2Satisfied) {
    steps.push({
      type: 'error',
      work: cloneVector(available),
      finish: finish0,
      description: `⏳ P${i} phải CHỜ: Tài nguyên không đủ để cấp phát ngay\nRequest[${i}] = ${formatVector(request)} > Available = ${formatVector(available)}`,
      safeSequence: [],
      isSafe: false,
      errorMessage: `P${i} phải chờ: tài nguyên không đủ`,
    });
    return {
      steps,
      isSafe: false,
      errorMessage: `P${i} phải chờ: tài nguyên không đủ`,
    };
  }

  // Step 3: Tentative allocation
  const newAvailable = vectorSub(cloneVector(available), request);
  const newAllocation = cloneMatrix(allocation);
  newAllocation[i] = vectorAdd(allocation[i], request);
  const newNeed = cloneMatrix(need);
  newNeed[i] = vectorSub(need[i], request);

  steps.push({
    type: 'tentative',
    processIndex: i,
    work: cloneVector(newAvailable),
    finish: finish0,
    description: `Bước 3: Thử cấp phát (giả định):\n  Available = Available - Request[${i}] = ${formatVector(newAvailable)}\n  Allocation[${i}] = Allocation[${i}] + Request[${i}] = ${formatVector(newAllocation[i])}\n  Need[${i}] = Need[${i}] - Request[${i}] = ${formatVector(newNeed[i])}\n\nBây giờ chạy thuật toán Banker để kiểm tra trạng thái an toàn...`,
    safeSequence: [],
  });

  // Step 4: Run safety check on tentative state
  const safetyResult = runSafetyCheck(newAvailable, newAllocation, newNeed, n, m);

  // Tag safety steps as continuations
  for (const step of safetyResult.steps) {
    steps.push({ ...step });
  }

  if (safetyResult.isSafe) {
    steps[steps.length - 1] = {
      ...steps[steps.length - 1],
      description:
        steps[steps.length - 1].description +
        `\n\n✅ Trạng thái AN TOÀN → Cấp phát tài nguyên cho P${i} được chấp thuận!`,
    };
  } else {
    steps[steps.length - 1] = {
      ...steps[steps.length - 1],
      description:
        steps[steps.length - 1].description +
        `\n\n⚠️ Trạng thái KHÔNG AN TOÀN → Hủy cấp phát, P${i} phải chờ\nKhôi phục trạng thái trước đó.`,
    };
  }

  return {
    steps,
    isSafe: safetyResult.isSafe,
    safeSequence: safetyResult.safeSequence,
  };
}
