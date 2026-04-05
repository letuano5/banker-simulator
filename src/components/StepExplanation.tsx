import { useEffect, useRef } from 'react';
import type { SimulationStep } from '../types';

interface StepExplanationProps {
  steps: SimulationStep[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
}

const stepTypeStyle: Record<string, string> = {
  init: 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700',
  check: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  allocate: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  skip: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  result: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  precheck: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  tentative: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
};

const stepTypeLabel: Record<string, string> = {
  init: 'Khởi tạo',
  check: 'Kiểm tra',
  allocate: 'Cấp phát',
  skip: 'Bỏ qua',
  result: 'Kết quả',
  error: 'Lỗi',
  precheck: 'Tiền kiểm tra',
  tentative: 'Thử cấp phát',
};

const stepTypeBadge: Record<string, string> = {
  init: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  check: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  allocate: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  skip: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
  result: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  error: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
  precheck: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  tentative: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
};

function ComparisonView({ comparison }: { comparison: NonNullable<SimulationStep['comparison']> }) {
  const color = comparison.satisfied
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="mt-2 font-mono text-xs flex items-center gap-2 flex-wrap">
      <span className="text-gray-600 dark:text-gray-400">{comparison.label}</span>
      <span className="text-gray-800 dark:text-gray-200">= [{comparison.lhs.join(', ')}]</span>
      <span className={`font-bold ${color}`}>
        {comparison.satisfied ? '≤' : '>'}
      </span>
      <span className="text-gray-600 dark:text-gray-400">{comparison.rhsLabel ?? 'Work'}</span>
      <span className="text-gray-800 dark:text-gray-200">= [{comparison.rhs.join(', ')}]</span>
      <span className={`font-bold ${color}`}>
        {comparison.satisfied ? '✓' : '✗'}
      </span>
    </div>
  );
}

export function StepExplanation({ steps, currentStepIndex, onStepClick }: StepExplanationProps) {
  const currentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentStepIndex]);

  const visibleSteps = currentStepIndex < 0 ? [] : steps.slice(0, currentStepIndex + 1);

  if (visibleSteps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-gray-400 dark:text-gray-600 text-sm">
        Nhấn "Chạy thuật toán" để bắt đầu simulation
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2 overflow-y-auto max-h-[480px] pr-1 scrollbar-thin">
      {visibleSteps.map((step, idx) => {
        const isCurrent = idx === visibleSteps.length - 1;
        const style = stepTypeStyle[step.type] ?? stepTypeStyle.init;
        const clickable = onStepClick != null && !isCurrent;

        return (
          <div
            key={idx}
            ref={isCurrent ? currentRef : undefined}
            onClick={clickable ? () => onStepClick(idx) : undefined}
            className={`rounded-lg border p-3 transition-all ${style} ${
              isCurrent
                ? 'ring-2 ring-blue-400 dark:ring-blue-500 shadow-sm'
                : clickable
                  ? 'opacity-60 hover:opacity-90 cursor-pointer hover:shadow-sm'
                  : 'opacity-70'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono w-6">{idx + 1}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stepTypeBadge[step.type] ?? stepTypeBadge.init}`}>
                {stepTypeLabel[step.type] ?? step.type}
              </span>
              {step.processIndex !== undefined && (
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  P{step.processIndex}
                </span>
              )}
            </div>
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">
              {step.description}
            </pre>
            {step.comparison && <ComparisonView comparison={step.comparison} />}
          </div>
        );
      })}
    </div>
  );
}
