import { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, GripVertical, RotateCcw } from 'lucide-react';
import type { Matrix, Vector } from '../types';
import { validateCustomOrder, parseOrderText } from '../lib/validateOrder';
import type { OrderValidationResult } from '../lib/validateOrder';
import { formatVector } from '../lib/matrixUtils';

interface OrderValidatorProps {
  initialOrder: number[];
  n: number;
  available: Vector;
  allocation: Matrix;
  need: Matrix;
}

export function OrderValidator({
  initialOrder, n, available, allocation, need,
}: OrderValidatorProps) {
  const [order, setOrder] = useState<number[]>([...initialOrder]);
  const [textInput, setTextInput] = useState(initialOrder.map((p) => `P${p}`).join(' '));
  const [result, setResult] = useState<OrderValidationResult | null>(null);
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const textRef = useRef<HTMLInputElement>(null);

  // Sync text input when order changes from drag
  useEffect(() => {
    setTextInput(order.map((p) => `P${p}`).join(' '));
    setResult(null);
  }, [order]);

  // Reset to initial when initialOrder prop changes (new algorithm run)
  useEffect(() => {
    setOrder([...initialOrder]);
    setResult(null);
  }, [initialOrder]);

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  const handleDragStart = (idx: number) => {
    setDragSrcIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (targetIdx: number) => {
    if (dragSrcIdx === null || dragSrcIdx === targetIdx) {
      setDragSrcIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...order];
    const [moved] = next.splice(dragSrcIdx, 1);
    next.splice(targetIdx, 0, moved);
    setOrder(next);
    setDragSrcIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragSrcIdx(null);
    setDragOverIdx(null);
  };

  // ── Text input ─────────────────────────────────────────────────────────────

  const handleTextChange = (raw: string) => {
    setTextInput(raw);
    const parsed = parseOrderText(raw);
    if (parsed.length === n) {
      setOrder(parsed);
    }
    setResult(null);
  };

  // ── Validate ───────────────────────────────────────────────────────────────

  const validate = () => {
    setResult(validateCustomOrder(order, available, allocation, need, n));
  };

  const reset = () => {
    setOrder([...initialOrder]);
    setResult(null);
  };

  const isModified = order.join(',') !== initialOrder.join(',');

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Kiểm tra Safe Sequence tuỳ chỉnh
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Kéo thả hoặc nhập thủ công để kiểm tra một thứ tự khác có hợp lệ không.
          </p>
        </div>
        {isModified && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Draggable badges */}
      <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[52px]">
        {order.map((p, idx) => (
          <div
            key={`${p}-${idx}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold select-none transition-all cursor-grab active:cursor-grabbing
              ${dragSrcIdx === idx
                ? 'opacity-40 scale-95 ring-2 ring-blue-400'
                : dragOverIdx === idx && dragSrcIdx !== null && dragSrcIdx !== idx
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 scale-105'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
          >
            <GripVertical size={12} className="text-gray-400 dark:text-gray-500 shrink-0" />
            P{p}
          </div>
        ))}
      </div>

      {/* Text input + Validate button */}
      <div className="flex gap-2 items-center mb-4">
        <div className="flex-1 relative">
          <input
            ref={textRef}
            type="text"
            value={textInput}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={`Ví dụ: P0 P2 P1 P3 P4  hoặc  0 2 1 3 4`}
            className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          onClick={validate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          Kiểm tra
        </button>
      </div>

      {/* Validation result */}
      {result && (
        <div className={`rounded-xl border p-4 flex flex-col gap-3
          ${result.valid
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          {/* Verdict */}
          <div className="flex items-center gap-2">
            {result.valid
              ? <CheckCircle size={18} className="text-green-600 dark:text-green-400 shrink-0" />
              : <XCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" />
            }
            <span className={`font-semibold text-sm ${result.valid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {result.valid
                ? `✅ Thứ tự hợp lệ! [${order.map((p) => `P${p}`).join(' → ')}] là một Safe Sequence.`
                : result.reason
                  ? `❌ Không hợp lệ: ${result.reason}`
                  : `❌ Thứ tự không hợp lệ — P${result.failedAt} không thể thực thi tại bước này.`
              }
            </span>
          </div>

          {/* Step-by-step table */}
          {result.steps.length > 0 && (
            <div className="overflow-auto scrollbar-thin">
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th className="py-1 pr-4 font-semibold whitespace-nowrap">Bước</th>
                    <th className="py-1 pr-4 font-semibold whitespace-nowrap">Need[Pi]</th>
                    <th className="py-1 pr-4 font-semibold whitespace-nowrap">Work</th>
                    <th className="py-1 pr-4 font-semibold whitespace-nowrap">Need ≤ Work?</th>
                    <th className="py-1 font-semibold whitespace-nowrap">Work sau</th>
                  </tr>
                </thead>
                <tbody>
                  {result.steps.map((step, i) => (
                    <tr
                      key={i}
                      className={`border-t border-gray-200 dark:border-gray-700
                        ${!step.satisfied ? 'bg-red-100 dark:bg-red-900/30' : ''}
                      `}
                    >
                      <td className="py-1.5 pr-4 font-bold text-gray-800 dark:text-gray-200">
                        P{step.processIndex}
                      </td>
                      <td className="py-1.5 pr-4 font-mono text-gray-700 dark:text-gray-300">
                        {formatVector(step.need)}
                      </td>
                      <td className="py-1.5 pr-4 font-mono text-gray-700 dark:text-gray-300">
                        {formatVector(step.work)}
                      </td>
                      <td className="py-1.5 pr-4">
                        <span className={`font-bold ${step.satisfied ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {step.satisfied ? '✓ Có' : '✗ Không'}
                        </span>
                      </td>
                      <td className="py-1.5 font-mono text-gray-600 dark:text-gray-400">
                        {step.satisfied ? formatVector(step.newWork) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
