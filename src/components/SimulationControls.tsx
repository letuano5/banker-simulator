import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';

interface SimulationControlsProps {
  isPlaying: boolean;
  isDone: boolean;
  currentStepIndex: number;
  totalSteps: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (ms: number) => void;
  onRun: () => void;
  hasResult: boolean;
}

const MIN_MS = 50;
const MAX_MS = 3000;

export function SimulationControls({
  isPlaying, isDone, currentStepIndex, totalSteps,
  speed, onPlay, onPause, onStep, onStepBack, onReset, onSpeedChange, onRun, hasResult,
}: SimulationControlsProps) {
  const handleNumberInput = (raw: string) => {
    const v = parseInt(raw, 10);
    if (!isNaN(v)) onSpeedChange(Math.min(MAX_MS, Math.max(MIN_MS, v)));
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Run button */}
      <button
        onClick={onRun}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
      >
        {hasResult ? 'Chạy lại' : '▶ Chạy thuật toán'}
      </button>

      {hasResult && (
        <>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Reset về bước đầu"
          >
            <RotateCcw size={16} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={isDone && !isPlaying}
            className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors disabled:opacity-40"
            title={isPlaying ? 'Dừng' : 'Phát tự động'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Step back */}
          <button
            onClick={onStepBack}
            disabled={currentStepIndex <= -1}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
            title="Bước trước"
          >
            <SkipBack size={16} />
          </button>

          {/* Step forward */}
          <button
            onClick={onStep}
            disabled={isDone}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
            title="Bước tiếp theo"
          >
            <SkipForward size={16} />
          </button>

          {/* Step counter */}
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono tabular-nums">
            {currentStepIndex < 0 ? '—' : currentStepIndex + 1} / {totalSteps}
          </span>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Speed: slider + number input */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Delay:</span>
            <input
              type="range"
              min={MIN_MS}
              max={MAX_MS}
              step={50}
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-28 h-1.5 accent-blue-600 cursor-pointer"
            />
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <input
                type="number"
                min={MIN_MS}
                max={MAX_MS}
                step={50}
                value={speed}
                onChange={(e) => handleNumberInput(e.target.value)}
                className="w-16 px-2 py-1 text-xs font-mono text-center bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
              />
              <span className="px-1.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 border-l border-gray-300 dark:border-gray-600 select-none">
                ms
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
