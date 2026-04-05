import type { SimulationStep } from '../types';

interface ExecutionOrderProps {
  steps: SimulationStep[];
  currentStepIndex: number;
  isDeadlock?: boolean;
}

export function ExecutionOrder({ steps, currentStepIndex, isDeadlock = false }: ExecutionOrderProps) {
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
  const safeSequence = currentStep?.safeSequence ?? [];
  const resultStep = steps[steps.length - 1];
  const isDone = currentStepIndex >= steps.length - 1 && steps.length > 0;
  const isSafe = resultStep?.isSafe;
  const deadlocked = resultStep?.deadlockedProcesses ?? [];

  if (!currentStep) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-2xl">⚙️</span>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-600 text-center">
          {isDeadlock ? 'Thứ tự hoàn thành' : 'Safe Sequence'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Process chain */}
      <div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          {isDeadlock ? 'Thứ tự hoàn thành' : 'Safe Sequence'}
        </div>
        <div className="flex flex-wrap gap-2 items-center min-h-[40px]">
          {safeSequence.length === 0 ? (
            <span className="text-sm text-gray-400 dark:text-gray-500 italic">Chưa có...</span>
          ) : (
            safeSequence.map((pi, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <div className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm
                  ${idx === safeSequence.length - 1 && !isDone
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300 dark:ring-blue-600 animate-pulse'
                    : 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                  }`}
                >
                  P{pi}
                </div>
                {idx < safeSequence.length - 1 && (
                  <span className="text-gray-400 dark:text-gray-600 font-bold">→</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Work vector */}
      <div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Work hiện tại
        </div>
        <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200">
          [{currentStep.work.join(', ')}]
        </div>
      </div>

      {/* Finish array */}
      <div>
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Finish
        </div>
        <div className="flex flex-wrap gap-1.5">
          {currentStep.finish.map((f, i) => (
            <div
              key={i}
              className={`px-2 py-1 rounded text-xs font-mono font-medium
                ${f
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                }`}
            >
              P{i}:{f ? 'T' : 'F'}
            </div>
          ))}
        </div>
      </div>

      {/* Final verdict */}
      {isDone && (
        <div className={`mt-2 p-4 rounded-xl text-center font-bold text-lg border-2
          ${isSafe
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
          }`}
        >
          {isSafe
            ? isDeadlock ? '✅ Không có bế tắc' : '✅ AN TOÀN'
            : isDeadlock
              ? `🔴 BẾ TẮC: ${deadlocked.map((i) => `P${i}`).join(', ')}`
              : '❌ KHÔNG AN TOÀN'
          }
        </div>
      )}
    </div>
  );
}
