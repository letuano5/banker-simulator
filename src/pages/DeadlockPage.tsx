import { Trash2, Download } from 'lucide-react';
import { useMatrixState } from '../hooks/useMatrixState';
import { MatrixInput } from '../components/MatrixInput';
import { DimensionControls } from '../components/DimensionControls';
import { FileImportButton } from '../components/FileImportButton';
import { SimulationPanel } from '../components/SimulationPanel';
import { runDeadlockDetection } from '../lib/deadlockDetection';
import { validateInputMatrix, validateInputVector } from '../lib/matrixUtils';
import { exportDeadlockFile, downloadTextFile } from '../hooks/useFileImport';
import type { SimulationStep } from '../types';
import { useState } from 'react';

export function DeadlockPage() {
  const ms = useMatrixState({ syncMode: 'deadlock', initialN: 5, initialM: 3 });
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [highlightRow, setHighlightRow] = useState<number | undefined>(undefined);
  const [validationError, setValidationError] = useState<string | null>(null);

  const runAlgorithm = () => {
    setValidationError(null);
    try {
      const available = validateInputVector(ms.available, 'Available');
      const allocation = validateInputMatrix(ms.dlAllocation, 'Allocation');
      const request = validateInputMatrix(ms.dlRequest, 'Request');
      const result = runDeadlockDetection(available, allocation, request, ms.n, ms.m);
      setSteps(result.steps);
      setHighlightRow(undefined);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Dữ liệu không hợp lệ');
    }
  };

  const handleExport = () => {
    const content = exportDeadlockFile(ms.n, ms.m, ms.available, ms.dlAllocation, ms.dlRequest);
    downloadTextFile('deadlock-state.txt', content);
  };

  const handleClearData = () => {
    if (!confirm('Xoá toàn bộ dữ liệu đã lưu và reset về mặc định?')) return;
    ms.clearStorage();
    setSteps([]);
    setValidationError(null);
  };

  const resultStep = steps[steps.length - 1];
  const deadlockedSet = resultStep?.deadlockedProcesses
    ? new Set(resultStep.deadlockedProcesses)
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Deadlock Detection
          </h1>
          <span className="text-xs text-gray-400 dark:text-gray-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Tự động lưu
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DimensionControls
            n={ms.n} m={ms.m}
            onChangeN={ms.setN} onChangeM={ms.setM}
            onAddRow={ms.addRow} onAddColumn={ms.addColumn}
          />
          <FileImportButton mode="deadlock" onImport={ms.importDeadlock} />
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
            title="Xuất trạng thái hiện tại ra file"
          >
            <Download size={13} />
            Export
          </button>
          <button
            onClick={handleClearData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Xoá dữ liệu đã lưu và reset"
          >
            <Trash2 size={13} />
            Xoá dữ liệu
          </button>
        </div>
      </div>

      {/* Matrix grid */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <MatrixInput
            label="Available"
            labelColor="text-teal-600 dark:text-teal-400"
            data={ms.available} isVector
            n={ms.n} m={ms.m}
            onChange={ms.setAvailableCell}
          />
          <MatrixInput
            label="Allocation"
            labelColor="text-purple-600 dark:text-purple-400"
            data={ms.dlAllocation} n={ms.n} m={ms.m}
            onChange={ms.setDlAllocationCell}
            highlightRow={highlightRow}
            highlightRows={deadlockedSet}
            highlightRowColor="red"
          />
          <MatrixInput
            label="Request"
            labelColor="text-orange-600 dark:text-orange-400"
            data={ms.dlRequest} n={ms.n} m={ms.m}
            onChange={ms.setDlRequestCell}
            highlightRow={highlightRow}
            highlightRows={deadlockedSet}
            highlightRowColor="red"
          />
        </div>
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <span className="font-semibold">Lưu ý:</span>
            {' '}Finish[i] = true nếu Allocation[i] = 0 (tiến trình không giữ tài nguyên nào).
            {' '}Ô màu vàng = chưa nhập — cần điền đầy đủ trước khi chạy thuật toán.
          </div>
        </div>
      </div>

      {/* Simulation panel */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Simulation</h2>
        {validationError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
            <span className="font-bold shrink-0">⚠ Không thể chạy:</span>
            <span>{validationError}</span>
          </div>
        )}
        <SimulationPanel
          steps={steps}
          isDeadlock
          onRun={runAlgorithm}
          onHighlightChange={setHighlightRow}
        />
      </div>
    </div>
  );
}
