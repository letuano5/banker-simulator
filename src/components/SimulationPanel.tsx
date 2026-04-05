import { useEffect } from 'react';
import type { Matrix, SimulationStep, Vector } from '../types';
import { StepExplanation } from './StepExplanation';
import { ExecutionOrder } from './ExecutionOrder';
import { SimulationControls } from './SimulationControls';
import { OrderValidator } from './OrderValidator';
import { useSimulation } from '../hooks/useSimulation';

export interface ValidationData {
  n: number;
  available: Vector;
  allocation: Matrix;
  need: Matrix;
}

interface SimulationPanelProps {
  steps: SimulationStep[];
  isDeadlock?: boolean;
  onRun: () => void;
  onHighlightChange?: (processIndex: number | undefined) => void;
  /** Passed for Banker pages to enable custom order validation */
  validationData?: ValidationData;
}

export function SimulationPanel({
  steps, isDeadlock = false, onRun, onHighlightChange, validationData,
}: SimulationPanelProps) {
  const { currentStepIndex, totalSteps, isPlaying, isDone, speed, controls } =
    useSimulation(steps);

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  useEffect(() => {
    onHighlightChange?.(currentStep?.processIndex);
  }, [currentStep?.processIndex, onHighlightChange]);

  // The result step is always the last one
  const resultStep = steps[steps.length - 1];
  const showOrderValidator =
    isDone &&
    resultStep?.isSafe === true &&
    validationData != null &&
    (resultStep.safeSequence?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <SimulationControls
        isPlaying={isPlaying}
        isDone={isDone}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        speed={speed}
        onPlay={controls.play}
        onPause={controls.pause}
        onStep={controls.step}
        onReset={controls.reset}
        onSpeedChange={controls.setSpeed}
        onRun={onRun}
        hasResult={steps.length > 0}
      />

      {/* Two columns */}
      {steps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left: Step explanation (60%) */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Các bước thực hiện
            </div>
            <StepExplanation steps={steps} currentStepIndex={currentStepIndex} />
          </div>

          {/* Right: Execution order (40%) */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {isDeadlock ? 'Trạng thái hệ thống' : 'Safe Sequence'}
            </div>
            <ExecutionOrder
              steps={steps}
              currentStepIndex={currentStepIndex}
              isDeadlock={isDeadlock}
            />

            {/* Order Validator — shown after algorithm finishes with a safe result */}
            {showOrderValidator && validationData && (
              <OrderValidator
                initialOrder={resultStep.safeSequence}
                n={validationData.n}
                available={validationData.available}
                allocation={validationData.allocation}
                need={validationData.need}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
